// =========================================================
// TOOTA BHAROSA — script.js
// Vanilla JS only: smooth scroll, share, comments, replies
// =========================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Smooth scrolling for in-page links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- Share button ---------- */
  const shareBtn = document.getElementById('shareBtn');
  const shareFeedback = document.getElementById('shareFeedback');

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: document.title,
        text: 'Jab Bharosa Tootta Hai — a journal on trust, pain and self-respect.',
        url: window.location.href
      };

      // Prefer the native Web Share API on supporting devices (mostly mobile)
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          // user cancelled the share sheet — no error needed
        }
        return;
      }

      // Desktop fallback: copy the link to the clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        showShareFeedback('Link copied to clipboard.');
      } catch (err) {
        // last-resort fallback if clipboard API is unavailable
        window.prompt('Copy this link:', shareData.url);
      }
    });
  }

  function showShareFeedback(message) {
    if (!shareFeedback) return;
    shareFeedback.textContent = message;
    setTimeout(() => { shareFeedback.textContent = ''; }, 3000);
  }

  /* ---------- View web version (placeholder for a Blogger-style link) ---------- */
  const webVersionLink = document.getElementById('webVersionLink');
  if (webVersionLink) {
    webVersionLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Reply button interaction (existing comments) ---------- */
  document.querySelectorAll('.reply-link').forEach(btn => {
    btn.addEventListener('click', () => toggleReplyBox(btn));
  });

  function toggleReplyBox(triggerBtn) {
    const commentBody = triggerBtn.closest('.comment__body');
    const existingBox = Array.from(commentBody.children).find(child => child.classList && child.classList.contains('reply-box'));

    if (existingBox) {
      existingBox.remove();
      return;
    }

    // close any other open reply boxes for a cleaner mobile experience
    document.querySelectorAll('.reply-box').forEach(box => box.remove());

    const box = document.createElement('div');
    box.className = 'reply-box';
    box.innerHTML = `
      <textarea placeholder="Write a reply..." aria-label="Write a reply"></textarea>
      <div class="reply-box__actions">
        <button type="button" class="reply-submit">Reply</button>
        <button type="button" class="reply-cancel">Cancel</button>
      </div>
    `;

    commentBody.appendChild(box);
    box.querySelector('textarea').focus();

    box.querySelector('.reply-cancel').addEventListener('click', () => box.remove());

    box.querySelector('.reply-submit').addEventListener('click', () => {
      const textarea = box.querySelector('textarea');
      const text = textarea.value.trim();
      if (!text) {
        textarea.focus();
        return;
      }

      let nestedList = Array.from(commentBody.children).find(child => child.classList && child.classList.contains('comment-list--nested'));
      if (!nestedList) {
        nestedList = document.createElement('ul');
        nestedList.className = 'comment-list comment-list--nested';
        commentBody.appendChild(nestedList);
      }

      nestedList.appendChild(buildCommentEl('Anonymous', text));
      box.remove();
    });
  }

  /* ---------- Comment form ---------- */
  const commentForm = document.getElementById('commentForm');
  const commentList = document.getElementById('commentList');
  const commentNameInput = document.getElementById('commentName');
  const commentTextInput = document.getElementById('commentText');

  if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = commentTextInput.value.trim();
      if (!text) {
        commentTextInput.focus();
        return;
      }

      const name = commentNameInput.value.trim() || 'Anonymous';
      const newComment = buildCommentEl(name, text);
      commentList.appendChild(newComment);

      // attach reply behaviour to the freshly created comment
      newComment.querySelector('.reply-link').addEventListener('click', function () {
        toggleReplyBox(this);
      });

      commentForm.reset();
      newComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function buildCommentEl(name, text) {
    const li = document.createElement('li');
    li.className = 'comment';

    const initial = name.trim().charAt(0).toUpperCase() || 'A';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    li.innerHTML = `
      <div class="comment__avatar" aria-hidden="true">${initial}</div>
      <div class="comment__body">
        <p class="comment__meta"><span class="comment__name">${escapeHtml(name)}</span> <span class="comment__date">${dateStr} at ${timeStr}</span></p>
        <p class="comment__text"></p>
        <button type="button" class="reply-link">Reply</button>
      </div>
    `;

    // set text via textContent to avoid HTML injection from user input
    li.querySelector('.comment__text').textContent = text;

    return li;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

});
