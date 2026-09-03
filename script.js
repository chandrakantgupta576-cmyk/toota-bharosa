// =========================================================
// TOOTA BHAROSA — Firebase Comments + Share
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {

  // ---------------------------------------------------------
  // FIREBASE CONFIG
  // ---------------------------------------------------------
  const firebaseConfig = {
    apiKey: "AIzaSyCE2-zZlc4aVNTp9RNCNlrHRIqx3t9Zk",
    authDomain: "toota-bharosa-ccb28.firebaseapp.com",
    projectId: "toota-bharosa-ccb28",
    storageBucket: "toota-bharosa-ccb28.firebasestorage.app",
    messagingSenderId: "371759431273",
    appId: "1:371759431273:web:23542cee1056423fbecf8"
  };

  // ---------------------------------------------------------
  // FIREBASE CHECK
  // ---------------------------------------------------------
  if (!window.firebase) {
    console.error("Firebase SDK load nahi hua.");
    alert("Firebase load nahi hua. Page ko refresh karke dobara try karo.");
    return;
  }

  // Firebase initialize
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.firestore();

  // ---------------------------------------------------------
  // HTML ELEMENTS
  // ---------------------------------------------------------
  const commentForm = document.getElementById("commentForm");
  const commentList = document.getElementById("commentList");
  const commentNameInput = document.getElementById("commentName");
  const commentTextInput = document.getElementById("commentText");

  // ---------------------------------------------------------
  // LOAD COMMENTS
  // ---------------------------------------------------------
  async function loadComments() {

    if (!commentList) {
      console.error("commentList nahi mila.");
      return;
    }

    try {

      // Purane Firebase comments clear karo
      commentList.innerHTML = "";

      const snapshot = await db
        .collection("comments")
        .orderBy("createdAt", "asc")
        .get();

      snapshot.forEach((doc) => {

        const data = doc.data();

        // Sirf main comments
        if (!data.parentId) {

          const commentElement = buildCommentEl(
            data.name || "Anonymous",
            data.text || "",
            data.createdAt,
            doc.id
          );

          commentList.appendChild(commentElement);

          // Replies load karo
          loadReplies(doc.id, commentElement);
        }

      });

    } catch (error) {

      console.error("Comments load nahi hue:", error);

      // Agar index issue ho
      if (error.code === "failed-precondition") {
        console.error(
          "Firestore index required. Firebase Console me index create karo."
        );
      }
    }
  }

  // ---------------------------------------------------------
  // LOAD REPLIES
  // ---------------------------------------------------------
  async function loadReplies(parentId, parentElement) {

    try {

      const snapshot = await db
        .collection("comments")
        .where("parentId", "==", parentId)
        .orderBy("createdAt", "asc")
        .get();

      if (snapshot.empty) {
        return;
      }

      const commentBody =
        parentElement.querySelector(".comment__body");

      if (!commentBody) {
        return;
      }

      let nestedList =
        commentBody.querySelector(".comment-list--nested");

      if (!nestedList) {

        nestedList = document.createElement("ul");

        nestedList.className =
          "comment-list comment-list--nested";

        commentBody.appendChild(nestedList);
      }

      snapshot.forEach((doc) => {

        const data = doc.data();

        const replyElement = buildCommentEl(
          data.name || "Anonymous",
          data.text || "",
          data.createdAt,
          doc.id
        );

        nestedList.appendChild(replyElement);

        // Nested replies
        loadReplies(doc.id, replyElement);
      });

    } catch (error) {

      console.error("Replies load nahi hui:", error);

    }
  }

  // ---------------------------------------------------------
  // ADD NEW COMMENT
  // ---------------------------------------------------------
  if (commentForm) {

    commentForm.addEventListener("submit", async (e) => {

      e.preventDefault();

      const text =
        commentTextInput
          ? commentTextInput.value.trim()
          : "";

      if (!text) {

        if (commentTextInput) {
          commentTextInput.focus();
        }

        return;
      }

      const name =
        commentNameInput
          ? commentNameInput.value.trim() || "Anonymous"
          : "Anonymous";

      const publishButton =
        commentForm.querySelector(
          "button[type='submit']"
        );

      if (publishButton) {
        publishButton.disabled = true;
        publishButton.textContent = "Publishing...";
      }

      try {

        // Firebase Firestore me comment save
        await db.collection("comments").add({

          name: name,

          text: text,

          parentId: null,

          createdAt:
            firebase.firestore.FieldValue.serverTimestamp()

        });

        // Form clear
        commentForm.reset();

        alert("Comment published successfully! ❤️");

        // Comments dobara load
        await loadComments();

      } catch (error) {

        console.error("Comment save error:", error);

        alert(
          "Comment save nahi hua.\n\n" +
          "Firebase Firestore Rules check karo."
        );

      } finally {

        if (publishButton) {
          publishButton.disabled = false;
          publishButton.textContent = "Publish";
        }

      }

    });

  }

  // ---------------------------------------------------------
  // BUILD COMMENT
  // ---------------------------------------------------------
  function buildCommentEl(
    name,
    text,
    timestamp,
    commentId
  ) {

    const li = document.createElement("li");

    li.className = "comment";

    li.dataset.commentId = commentId;

    // First letter
    const initial =
      name.trim().charAt(0).toUpperCase() || "A";

    // Date
    let dateStr = "";

    if (
      timestamp &&
      typeof timestamp.toDate === "function"
    ) {

      const date = timestamp.toDate();

      dateStr =
        date.toLocaleDateString(
          "en-GB",
          {
            day: "numeric",
            month: "long",
            year: "numeric"
          }
        );

      const timeStr =
        date.toLocaleTimeString(
          "en-GB",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );

      dateStr += " at " + timeStr;

    } else {

      dateStr = "Just now";

    }

    // Comment HTML
    li.innerHTML = `

      <div
        class="comment__avatar"
        aria-hidden="true">
        ${escapeHtml(initial)}
      </div>

      <div class="comment__body">

        <p class="comment__meta">

          <span class="comment__name">
            ${escapeHtml(name)}
          </span>

          <span class="comment__date">
            ${escapeHtml(dateStr)}
          </span>

        </p>

        <p class="comment__text"></p>

        <button
          type="button"
          class="reply-link">
          Reply
        </button>

      </div>

    `;

    // User text safely insert
    const textElement =
      li.querySelector(".comment__text");

    if (textElement) {
      textElement.textContent = text;
    }

    // Reply button
    const replyButton =
      li.querySelector(".reply-link");

    if (replyButton) {

      replyButton.addEventListener(
        "click",
        () => {
          toggleReplyBox(li);
        }
      );

    }

    return li;
  }

  // ---------------------------------------------------------
  // REPLY BOX
  // ---------------------------------------------------------
  function toggleReplyBox(commentElement) {

    const commentBody =
      commentElement.querySelector(".comment__body");

    if (!commentBody) {
      return;
    }

    // Agar already open hai to close
    const oldBox =
      commentBody.querySelector(".reply-box");

    if (oldBox) {

      oldBox.remove();

      return;
    }

    // Dusre reply boxes close
    document
      .querySelectorAll(".reply-box")
      .forEach((box) => {
        box.remove();
      });

    // Reply box
    const box =
      document.createElement("div");

    box.className = "reply-box";

    box.innerHTML = `

      <textarea
        placeholder="Write a reply..."
        aria-label="Write a reply">
      </textarea>

      <div class="reply-box__actions">

        <button
          type="button"
          class="reply-submit">
          Reply
        </button>

        <button
          type="button"
          class="reply-cancel">
          Cancel
        </button>

      </div>

    `;

    commentBody.appendChild(box);

    const textarea =
      box.querySelector("textarea");

    if (textarea) {
      textarea.focus();
    }

    // -------------------------------------------------------
    // CANCEL REPLY
    // -------------------------------------------------------
    const cancelButton =
      box.querySelector(".reply-cancel");

    if (cancelButton) {

      cancelButton.addEventListener(
        "click",
        () => {
          box.remove();
        }
      );

    }

    // -------------------------------------------------------
    // SUBMIT REPLY
    // -------------------------------------------------------
    const replyButton =
      box.querySelector(".reply-submit");

    if (replyButton) {

      replyButton.addEventListener(
        "click",
        async () => {

          const text =
            textarea.value.trim();

          if (!text) {

            textarea.focus();

            return;
          }

          const parentId =
            commentElement.dataset.commentId;

          replyButton.disabled = true;
          replyButton.textContent = "Sending...";

          try {

            await db
              .collection("comments")
              .add({

                name: "Anonymous",

                text: text,

                parentId: parentId,

                createdAt:
                  firebase.firestore.FieldValue
                    .serverTimestamp()

              });

            box.remove();

            alert("Reply published! ❤️");

            // Replies/comments dobara load
            await loadComments();

          } catch (error) {

            console.error(
              "Reply save error:",
              error
            );

            alert(
              "Reply save nahi hua.\n\n" +
              "Firebase Rules check karo."
            );

            replyButton.disabled = false;
            replyButton.textContent = "Reply";

          }

        }
      );

    }

  }

  // ---------------------------------------------------------
  // ESCAPE HTML
  // ---------------------------------------------------------
  function escapeHtml(str) {

    const div =
      document.createElement("div");

    div.textContent = String(str);

    return div.innerHTML;
  }

  // ---------------------------------------------------------
  // SMOOTH SCROLL
  // ---------------------------------------------------------
  document
    .querySelectorAll('a[href^="#"]')
    .forEach((link) => {

      link.addEventListener(
        "click",
        (e) => {

          const targetId =
            link.getAttribute("href");

          if (!targetId || targetId === "#") {
            return;
          }

          const target =
            document.querySelector(targetId);

          if (target) {

            e.preventDefault();

            target.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          }

        }
      );

    });

  // ---------------------------------------------------------
  // SHARE BUTTON
  // ---------------------------------------------------------
  const shareBtn =
    document.getElementById("shareBtn");

  const shareFeedback =
    document.getElementById("shareFeedback");

  if (shareBtn) {

    shareBtn.addEventListener(
      "click",
      async () => {

        const shareData = {

          title:
            document.title ||
            "Toota Bharosa",

          text:
            "Jab Bharosa Tootta Hai — a journal on trust, pain and self-respect.",

          url:
            window.location.href

        };

        // ---------------------------------------------------
        // MOBILE / SUPPORTED BROWSER SHARE
        // ---------------------------------------------------
        if (navigator.share) {

          try {

            await navigator.share(shareData);

            // Successfully shared
            return;

          } catch (error) {

            // User cancelled ya native share fail hua
            console.log(
              "Native share cancelled/failed."
            );

          }

        }

        // ---------------------------------------------------
        // COPY LINK FALLBACK
        // ---------------------------------------------------
        try {

          if (
            navigator.clipboard &&
            window.isSecureContext
          ) {

            await navigator.clipboard
              .writeText(shareData.url);

          } else {

            // Old browser fallback
            const tempInput =
              document.createElement("input");

            tempInput.value =
              shareData.url;

            document.body.appendChild(tempInput);

            tempInput.select();

            document.execCommand("copy");

            tempInput.remove();

          }

          if (shareFeedback) {

            shareFeedback.textContent =
              "Link copied to clipboard. ❤️";

            setTimeout(() => {

              shareFeedback.textContent = "";

            }, 3000);

          }

        } catch (error) {

          console.error(
            "Copy link failed:",
            error
          );

          // Last fallback
          window.prompt(
            "Copy this link:",
            shareData.url
          );

        }

      }
    );

  }

  // ---------------------------------------------------------
  // LOAD EXISTING COMMENTS
  // ---------------------------------------------------------
  await loadComments();

});
