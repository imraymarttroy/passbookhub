/* Community: Reddit-style posts, up/down votes and threaded comments (Firebase).
   Data: community/{postId} { author, title, body, flair, createdAt, score, comments }
         community/{postId}/votes/{uid} { v: 1 | -1 }
         community/{postId}/comments/{id} { author, text, parent, createdAt }
   render(ctx) builds the page; ctx gives the app's DOM helpers. */
window.COMM = (function () {
  'use strict';

  const F = function () { return window.FB.F; };
  const db = function () { return window.FB.db; };
  const me = function () { return window.FB.auth.currentUser && window.FB.auth.currentUser.uid; };

  const FLAIRS = [
    ['ipon', 'Ipon', '🐷', 'Saving tips, ipon challenges and wins'],
    ['budget', 'Budget', '📊', 'Budget plans, 50/30/20 and tracking'],
    ['sweldo', 'Sweldo', '💸', 'Payday, salary and side hustles'],
    ['utang', 'Utang', '💳', 'Debt, loans and paying it off'],
    ['invest', 'Invest', '📈', 'MP2, stocks, funds and more'],
    ['tanong', 'Tanong', '❓', 'Ask the community anything'],
    ['kwento', 'Kwento', '💬', 'Stories, rants and small wins']
  ];
  const FLAIR = {};
  FLAIRS.forEach(function (f) { FLAIR[f[0]] = f; });
  const TITLE_MAX = 120, BODY_MAX = 3000, COMMENT_MAX = 1500;

  const postsCol = function () { return F().collection(db(), 'community'); };
  const postDoc = function (id) { return F().doc(db(), 'community', id); };
  const voteDoc = function (id, uid) { return F().doc(db(), 'community', id, 'votes', uid); };
  const commentsCol = function (id) { return F().collection(db(), 'community', id, 'comments'); };

  function friendly(error) {
    console.error(error);
    const code = (error && error.code) || '';
    if (code === 'permission-denied') return new Error('denied');
    if (code === 'unavailable') return new Error('We could not reach the server. Check your connection.');
    return new Error('Something went wrong. Please try again.');
  }

  /* ---------- Data ---------- */
  async function listPosts() {
    try {
      const snap = await F().getDocs(F().query(postsCol(), F().orderBy('createdAt', 'desc'), F().limit(150)));
      return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    } catch (e) { throw friendly(e); }
  }
  async function getPost(id) {
    try {
      const d = await F().getDoc(postDoc(id));
      return d.exists() ? Object.assign({ id: d.id }, d.data()) : null;
    } catch (e) { throw friendly(e); }
  }
  async function myVotes(ids) {
    const uid = me();
    const out = {};
    await Promise.all(ids.map(function (id) {
      return F().getDoc(voteDoc(id, uid)).then(function (d) { if (d.exists()) out[id] = d.data().v; }, function () {});
    }));
    return out;
  }
  async function createPost(data) {
    const title = String(data.title || '').trim(), body = String(data.body || '').trim();
    if (!title) throw new Error('Add a title.');
    if (title.length > TITLE_MAX) throw new Error('Keep the title under ' + TITLE_MAX + ' characters.');
    if (body.length > BODY_MAX) throw new Error('Keep the text under ' + BODY_MAX + ' characters.');
    if (!FLAIR[data.flair]) throw new Error('Pick a community.');
    try {
      const ref = await F().addDoc(postsCol(), { author: me(), title: title, body: body, flair: data.flair, createdAt: Date.now(), score: 0, comments: 0 });
      return ref.id;
    } catch (e) { throw friendly(e); }
  }
  async function deletePost(id) {
    try { await F().deleteDoc(postDoc(id)); } catch (e) { throw friendly(e); }
  }
  /** Sets your vote to 1, -1 or 0 and moves the score by the difference, in one batch. */
  async function vote(post, next, prev) {
    if (next === prev) return;
    const b = F().writeBatch(db());
    if (next === 0) b.delete(voteDoc(post.id, me()));
    else b.set(voteDoc(post.id, me()), { v: next });
    b.update(postDoc(post.id), { score: F().increment(next - prev) });
    try { await b.commit(); } catch (e) { throw friendly(e); }
  }
  async function listComments(id) {
    try {
      const snap = await F().getDocs(F().query(commentsCol(id), F().orderBy('createdAt', 'asc'), F().limit(500)));
      return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    } catch (e) { throw friendly(e); }
  }
  async function addComment(postId, text, parent) {
    const t = String(text || '').trim();
    if (!t) throw new Error('Write something first.');
    if (t.length > COMMENT_MAX) throw new Error('Keep it under ' + COMMENT_MAX + ' characters.');
    const ref = F().doc(commentsCol(postId));
    const b = F().writeBatch(db());
    b.set(ref, { author: me(), text: t, parent: parent || '', createdAt: Date.now() });
    b.update(postDoc(postId), { comments: F().increment(1) });
    try { await b.commit(); } catch (e) { throw friendly(e); }
    return ref.id;
  }
  async function deleteComment(postId, commentId) {
    const b = F().writeBatch(db());
    b.delete(F().doc(commentsCol(postId), commentId));
    b.update(postDoc(postId), { comments: F().increment(-1) });
    try { await b.commit(); } catch (e) { throw friendly(e); }
  }

  /** Reddit's hot rank: votes count on a log scale, newer posts float up. */
  function hot(p) {
    const s = p.score || 0;
    const order = Math.log10(Math.max(Math.abs(s), 1));
    const sign = s > 0 ? 1 : s < 0 ? -1 : 0;
    return sign * order + (p.createdAt || 0) / 45000000;
  }

  /* ---------- View ---------- */
  function render(ctx) {
    const h = ctx.h, toast = ctx.toast, ask = ctx.ask, icon = ctx.icon, user = ctx.user;
    const people = {};
    function person(uid) {
      if (people[uid]) return Promise.resolve(people[uid]);
      return SOC.getProfile(uid).then(function (p) { people[uid] = p || { name: 'Someone', username: 'deleted' }; return people[uid]; },
        function () { people[uid] = { name: 'Someone', username: 'deleted' }; return people[uid]; });
    }
    const hash = location.hash.replace(/^#/, '');
    const m = /^community\/([A-Za-z0-9]{6,40})$/.exec(hash);
    const postId = m ? m[1] : null;

    let sort = 'hot';
    let flair = 'all';
    try { sort = sessionStorage.getItem('pbh.comm.sort') || 'hot'; flair = sessionStorage.getItem('pbh.comm.flair') || 'all'; } catch (e) { /* storage off */ }
    let posts = null, votes = {}, error = null;

    const main = h('div', { class: 'cm-main' });
    const side = h('aside', { class: 'cm-side' });
    const page = h('div', { class: 'wide cm-page' }, h('div', { class: 'cm-grid' }, main, side));

    /* ---- shared bits ---- */
    function since(ms) { return ctx.timeAgo(ms); }
    function flairTag(id) {
      const f = FLAIR[id] || FLAIRS[5];
      return h('a', { class: 'cm-flair', href: '#community', onclick: function (e) { e.preventDefault(); setFlair(id); if (postId) location.hash = '#community'; } }, f[2] + ' c/' + f[1]);
    }
    function byline(uid, when, extra) {
      const name = h('a', { class: 'cm-user', href: uid === me() ? '#profile' : '#' }, 'u/…');
      person(uid).then(function (p) { name.textContent = 'u/' + (p.username || 'someone'); if (uid !== me() && p.username) name.href = '#u/' + p.username; });
      return h('span', { class: 'cm-by' }, 'Posted by ', name, ' · ', h('time', { title: new Date(when).toLocaleString(I18N.locale) }, since(when)), extra || null);
    }
    function voteBox(p, horizontal) {
      const mine = votes[p.id] || 0;
      const up = h('button', { type: 'button', class: 'cm-vote up' + (mine === 1 ? ' on' : ''), 'aria-label': 'Upvote', 'aria-pressed': mine === 1 ? 'true' : 'false' }, '▲');
      const down = h('button', { type: 'button', class: 'cm-vote down' + (mine === -1 ? ' on' : ''), 'aria-label': 'Downvote', 'aria-pressed': mine === -1 ? 'true' : 'false' }, '▼');
      const n = h('span', { class: 'cm-score num' + (mine === 1 ? ' up' : mine === -1 ? ' down' : '') }, fmtScore(p.score || 0));
      async function cast(v) {
        const prev = votes[p.id] || 0;
        const next = prev === v ? 0 : v;
        votes[p.id] = next; p.score = (p.score || 0) + next - prev;
        repaint();
        try { await vote(p, next, prev); }
        catch (e) { votes[p.id] = prev; p.score = (p.score || 0) - (next - prev); repaint(); toast(e.message === 'denied' ? 'Voting isn’t available yet.' : e.message); }
      }
      function repaint() {
        const mv = votes[p.id] || 0;
        up.classList.toggle('on', mv === 1); down.classList.toggle('on', mv === -1);
        up.setAttribute('aria-pressed', mv === 1 ? 'true' : 'false'); down.setAttribute('aria-pressed', mv === -1 ? 'true' : 'false');
        n.className = 'cm-score num' + (mv === 1 ? ' up' : mv === -1 ? ' down' : '');
        n.textContent = fmtScore(p.score || 0);
      }
      up.addEventListener('click', function (e) { e.stopPropagation(); cast(1); });
      down.addEventListener('click', function (e) { e.stopPropagation(); cast(-1); });
      return h('div', { class: 'cm-votes' + (horizontal ? ' row' : '') }, up, n, down);
    }
    function fmtScore(n) { return Math.abs(n) >= 10000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n); }
    function share(p) {
      const url = location.origin + location.pathname + '#community/' + p.id;
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copied.'); }, function () { toast(url); });
      else toast(url);
    }
    function deniedNote() {
      return h('div', { class: 'cm-card cm-empty' },
        h('p', { class: 'cm-empty-t' }, 'Community is almost ready'),
        h('p', { class: 'small muted' }, 'The database rules for Community haven’t been published yet. Once they are, posts, votes and comments will show up here.'));
    }

    /* ---- sidebar ---- */
    function drawSide() {
      side.replaceChildren(
        h('section', { class: 'cm-card cm-about' },
          h('div', { class: 'cm-about-banner', 'aria-hidden': 'true' }),
          h('div', { class: 'cm-about-body' },
            h('h2', null, 'PassbookHub Community'),
            h('p', { class: 'small muted' }, 'Pinoy money talk: ipon, budgeting, utang and everything in between. Be kind, no selling, no asking for money.'),
            h('button', { type: 'button', class: 'btn primary cm-full', onclick: function () { composer(); } }, 'Create post'))),
        h('section', { class: 'cm-card' },
          h('h3', { class: 'cm-side-h' }, 'Communities'),
          h('ul', { class: 'cm-flairs' }, [['all', 'All', '🏠', 'Everything']].concat(FLAIRS).map(function (f) {
            return h('li', null, h('button', { type: 'button', class: 'cm-flair-row', 'aria-current': flair === f[0] && !postId ? 'true' : 'false',
              onclick: function () { setFlair(f[0]); if (postId) location.hash = '#community'; } },
              h('span', { class: 'cm-flair-ic', 'aria-hidden': 'true' }, f[2]), h('span', null, f[0] === 'all' ? 'All' : 'c/' + f[1])));
          }))),
        h('section', { class: 'cm-card' },
          h('h3', { class: 'cm-side-h' }, 'Rules'),
          h('ol', { class: 'cm-rules small' },
            h('li', null, 'Be kind. Talk about money, not people.'),
            h('li', null, 'No selling, scams, or asking for money or GCash.'),
            h('li', null, 'Never post account numbers, OTPs or IDs.'),
            h('li', null, 'Not financial advice. Do your own research.'))));
    }
    function setFlair(f) {
      flair = f;
      try { sessionStorage.setItem('pbh.comm.flair', f); } catch (e) { /* storage off */ }
      drawSide();
      if (!postId) drawList();
    }

    /* ---- list ---- */
    function drawList() {
      const head = h('div', { class: 'cm-card cm-create' },
        ctx.avatar(user, user.avatar, 2.25),
        h('button', { type: 'button', class: 'cm-create-in', onclick: function () { composer(); } }, 'Create a post'),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Create post', title: 'Create post', onclick: function () { composer(); } }, icon('edit')));
      const sorts = h('div', { class: 'cm-card cm-sorts', role: 'group', 'aria-label': 'Sort posts' },
        [['hot', '🔥 Hot'], ['new', '✨ New'], ['top', '🏆 Top']].map(function (s) {
          return h('button', { type: 'button', class: 'cm-sort', 'aria-pressed': sort === s[0] ? 'true' : 'false', onclick: function () {
            sort = s[0]; try { sessionStorage.setItem('pbh.comm.sort', sort); } catch (e) { /* storage off */ } drawList();
          } }, s[1]);
        }),
        flair !== 'all' ? h('span', { class: 'cm-sorts-flair' }, FLAIR[flair][2] + ' c/' + FLAIR[flair][1],
          h('button', { type: 'button', class: 'cm-x', 'aria-label': 'Show all communities', onclick: function () { setFlair('all'); } }, '✕')) : null);
      if (error) { main.replaceChildren(head, sorts, error === 'denied' ? deniedNote() : h('div', { class: 'cm-card cm-empty' }, h('p', null, error))); return; }
      if (!posts) { main.replaceChildren(head, sorts, h('div', { class: 'cm-card cm-empty' }, h('p', { class: 'muted' }, 'Loading…'))); return; }
      let list = posts.filter(function (p) { return flair === 'all' || p.flair === flair; });
      list = list.slice().sort(function (a, b) {
        if (sort === 'new') return b.createdAt - a.createdAt;
        if (sort === 'top') return (b.score || 0) - (a.score || 0) || b.createdAt - a.createdAt;
        return hot(b) - hot(a);
      });
      main.replaceChildren(head, sorts, list.length ? h('div', { class: 'cm-list' }, list.map(card))
        : h('div', { class: 'cm-card cm-empty' }, h('p', { class: 'cm-empty-t' }, 'No posts yet'), h('p', { class: 'small muted' }, 'Be the first to start a conversation.'),
          h('button', { type: 'button', class: 'btn primary', onclick: function () { composer(); } }, 'Create post')));
    }
    function card(p) {
      const open = function () { location.hash = '#community/' + p.id; };
      return h('article', { class: 'cm-card cm-post', onclick: function (e) { if (!e.target.closest('a, button')) open(); } },
        voteBox(p),
        h('div', { class: 'cm-post-main' },
          h('div', { class: 'cm-meta' }, flairTag(p.flair), byline(p.author, p.createdAt)),
          h('h2', { class: 'cm-title' }, h('a', { href: '#community/' + p.id }, p.title)),
          p.body ? h('p', { class: 'cm-body clamp' }, p.body) : null,
          h('div', { class: 'cm-actions' },
            h('a', { class: 'cm-act', href: '#community/' + p.id }, '💬 ' + (p.comments || 0) + (p.comments === 1 ? ' comment' : ' comments')),
            h('button', { type: 'button', class: 'cm-act', onclick: function () { share(p); } }, '↗ Share'),
            p.author === me() ? h('button', { type: 'button', class: 'cm-act', onclick: function () { removePost(p); } }, '🗑 Delete') : null)));
    }
    async function removePost(p) {
      const ok = await ask({ title: 'Delete this post?', body: 'It will be removed from Community for everyone.', yes: 'Delete', no: 'Keep' });
      if (!ok) return;
      try { await deletePost(p.id); } catch (e) { toast(e.message === 'denied' ? 'You can’t delete this post.' : e.message); return; }
      toast('Post deleted.');
      if (postId) { location.hash = '#community'; return; }
      posts = posts.filter(function (x) { return x.id !== p.id; });
      drawList();
    }

    /* ---- composer ---- */
    function composer() {
      const previous = document.activeElement;
      const flairSel = h('select', { id: 'cm-flair', class: 'cm-select' }, FLAIRS.map(function (f) { return h('option', { value: f[0] }, f[2] + ' c/' + f[1] + ' · ' + f[3]); }));
      flairSel.value = flair !== 'all' ? flair : 'tanong';
      const title = h('input', { id: 'cm-title', class: 'cm-input', maxlength: TITLE_MAX, placeholder: 'Title', autocomplete: 'off' });
      const count = h('span', { class: 'cm-count small muted num' }, '0/' + TITLE_MAX);
      title.addEventListener('input', function () { count.textContent = title.value.length + '/' + TITLE_MAX; });
      const body = h('textarea', { id: 'cm-body', class: 'cm-input cm-textarea', maxlength: BODY_MAX, rows: 6, placeholder: 'Text (optional)' });
      const err = h('p', { class: 'error small', role: 'alert', hidden: true });
      const post = h('button', { type: 'submit', class: 'btn primary' }, 'Post');
      const form = h('form', { class: 'cm-compose', novalidate: true, onsubmit: async function (e) {
        e.preventDefault();
        err.hidden = true;
        post.disabled = true;
        try {
          const id = await createPost({ title: title.value, body: body.value, flair: flairSel.value });
          close();
          toast('Posted to c/' + FLAIR[flairSel.value][1] + '.');
          location.hash = '#community/' + id;
        } catch (ex) {
          err.textContent = ex.message === 'denied' ? 'Community isn’t open for posting yet.' : ex.message;
          err.hidden = false;
        } finally { post.disabled = false; }
      } },
        h('div', { class: 'cm-compose-head' }, h('h2', { id: 'cm-compose-h' }, 'Create a post'),
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close', onclick: function () { close(); } }, icon('close'))),
        h('label', { class: 'cm-label', for: 'cm-flair' }, 'Community'), flairSel,
        h('label', { class: 'cm-label', for: 'cm-title' }, 'Title'), h('div', { class: 'cm-title-wrap' }, title, count),
        h('label', { class: 'cm-label', for: 'cm-body' }, 'Text'), body,
        h('p', { class: 'small muted' }, 'Never share account numbers, OTPs or IDs.'),
        err,
        h('div', { class: 'cm-compose-acts' }, h('button', { type: 'button', class: 'btn', onclick: function () { close(); } }, 'Cancel'), post));
      const overlay = h('div', { class: 'chat-overlay ask cm-overlay' }, h('div', { class: 'ask-card cm-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cm-compose-h' }, form));
      function onKey(e) { if (e.key === 'Escape') close(); }
      function close() { document.removeEventListener('keydown', onKey); overlay.remove(); if (previous && previous.isConnected) previous.focus(); }
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(overlay);
      title.focus();
    }

    /* ---- single post with comments ---- */
    async function drawPost() {
      main.replaceChildren(h('a', { class: 'cm-back', href: '#community' }, icon('prev'), 'Back to Community'), h('div', { class: 'cm-card cm-empty' }, h('p', { class: 'muted' }, 'Loading…')));
      let p, comments;
      try {
        p = await getPost(postId);
        if (!p) { main.replaceChildren(h('a', { class: 'cm-back', href: '#community' }, icon('prev'), 'Back to Community'), h('div', { class: 'cm-card cm-empty' }, h('p', { class: 'cm-empty-t' }, 'This post was deleted.'))); return; }
        const r = await Promise.all([listComments(postId), myVotes([postId])]);
        comments = r[0]; votes = Object.assign(votes, r[1]);
      } catch (e) {
        main.replaceChildren(h('a', { class: 'cm-back', href: '#community' }, icon('prev'), 'Back to Community'), e.message === 'denied' ? deniedNote() : h('div', { class: 'cm-card cm-empty' }, h('p', null, e.message)));
        return;
      }
      if (!page.isConnected && page.parentNode) return;
      const thread = h('div', { class: 'cm-thread' });
      const total = h('span', null, comments.length + (comments.length === 1 ? ' comment' : ' comments'));
      function drawThread() {
        const kids = {};
        comments.forEach(function (c) { (kids[c.parent || ''] = kids[c.parent || ''] || []).push(c); });
        const ids = {}; comments.forEach(function (c) { ids[c.id] = true; });
        /* Replies to a deleted comment move to the top level. */
        comments.forEach(function (c) { if (c.parent && !ids[c.parent]) { kids[''] = kids[''] || []; if (kids[''].indexOf(c) === -1) kids[''].push(c); } });
        function branch(parent, depth) {
          const list = (kids[parent] || []).slice().sort(function (a, b) { return a.createdAt - b.createdAt; });
          if (!list.length) return null;
          return h('ul', { class: 'cm-comments' + (depth ? ' nested' : '') }, list.map(function (c) { return comment(c, depth); }));
        }
        function comment(c, depth) {
          const replyBox = h('div', { class: 'cm-reply-box', hidden: true });
          const li = h('li', { class: 'cm-comment' },
            h('div', { class: 'cm-c-head' }, h('span', { class: 'cm-c-av' }), byline(c.author, c.createdAt, c.author === p.author ? h('span', { class: 'cm-op' }, ' OP') : null)),
            h('p', { class: 'cm-c-text' }, c.text),
            h('div', { class: 'cm-actions small' },
              depth < 5 ? h('button', { type: 'button', class: 'cm-act', onclick: function () {
                replyBox.hidden = !replyBox.hidden;
                if (!replyBox.hidden) { replyBox.replaceChildren(commentForm(c.id, function () { replyBox.hidden = true; })); replyBox.querySelector('textarea').focus(); }
              } }, '↩ Reply') : null,
              (c.author === me() || p.author === me()) ? h('button', { type: 'button', class: 'cm-act', onclick: async function () {
                const ok = await ask({ title: 'Delete this comment?', yes: 'Delete', no: 'Keep' });
                if (!ok) return;
                try { await deleteComment(p.id, c.id); } catch (e) { toast(e.message === 'denied' ? 'You can’t delete this comment.' : e.message); return; }
                comments = comments.filter(function (x) { return x.id !== c.id; }); p.comments = Math.max(0, (p.comments || 1) - 1);
                drawThread();
              } }, '🗑 Delete') : null),
            replyBox,
            branch(c.id, depth + 1));
          const av = li.querySelector('.cm-c-av');
          person(c.author).then(function (pp) { av.replaceChildren(ctx.avatar(pp, pp.avatar, 1.5)); });
          return li;
        }
        total.textContent = comments.length + (comments.length === 1 ? ' comment' : ' comments');
        thread.replaceChildren(branch('', 0) || h('p', { class: 'cm-empty-c small muted' }, 'No comments yet. Start the conversation.'));
      }
      function commentForm(parent, done) {
        const ta = h('textarea', { class: 'cm-input cm-textarea sm', rows: parent ? 2 : 3, maxlength: COMMENT_MAX, placeholder: parent ? 'Write a reply' : 'What are your thoughts?' });
        const btn = h('button', { type: 'submit', class: 'btn primary' }, parent ? 'Reply' : 'Comment');
        return h('form', { class: 'cm-cform', onsubmit: async function (e) {
          e.preventDefault();
          btn.disabled = true;
          try {
            const id = await addComment(p.id, ta.value, parent);
            comments.push({ id: id, author: me(), text: ta.value.trim(), parent: parent || '', createdAt: Date.now() });
            p.comments = (p.comments || 0) + 1;
            ta.value = '';
            if (done) done();
            drawThread();
          } catch (ex) { toast(ex.message === 'denied' ? 'Commenting isn’t available yet.' : ex.message); }
          finally { btn.disabled = false; }
        } }, ta, h('div', { class: 'cm-cform-acts' }, done ? h('button', { type: 'button', class: 'btn', onclick: done }, 'Cancel') : null, btn));
      }
      drawThread();
      main.replaceChildren(
        h('a', { class: 'cm-back', href: '#community' }, icon('prev'), 'Back to Community'),
        h('article', { class: 'cm-card cm-post open' },
          voteBox(p),
          h('div', { class: 'cm-post-main' },
            h('div', { class: 'cm-meta' }, flairTag(p.flair), byline(p.author, p.createdAt)),
            h('h1', { class: 'cm-title' }, p.title),
            p.body ? h('p', { class: 'cm-body' }, p.body) : null,
            h('div', { class: 'cm-actions' },
              h('span', { class: 'cm-act static' }, '💬 ', total),
              h('button', { type: 'button', class: 'cm-act', onclick: function () { share(p); } }, '↗ Share'),
              p.author === me() ? h('button', { type: 'button', class: 'cm-act', onclick: function () { removePost(p); } }, '🗑 Delete') : null),
            h('div', { class: 'cm-cbox' }, h('p', { class: 'small muted' }, 'Comment as ', h('strong', null, 'u/' + user.username)), commentForm('')),
            thread)));
    }

    async function load() {
      try {
        posts = await listPosts();
        drawList();
        votes = Object.assign(votes, await myVotes(posts.slice(0, 60).map(function (p) { return p.id; })));
      } catch (e) { error = e.message; }
      drawList();
    }

    drawSide();
    if (postId) drawPost();
    else { drawList(); load(); }
    return page;
  }

  return { render: render, FLAIRS: FLAIRS, listPosts: listPosts };
})();
