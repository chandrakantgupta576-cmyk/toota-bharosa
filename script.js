// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCE2-zZlc4aVNTp9RNCNlarHIqx3t9Zk",
  authDomain: "toota-bharosa-ccb28.firebaseapp.com",
  projectId: "toota-bharosa-ccb28",
  storageBucket: "toota-bharosa-ccb28.firebasestorage.app",
  messagingSenderId: "371759431273",
  appId: "1:371759431273:web:23542cee1056423fbecf8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


// ===============================
// SMOOTH SCROLL
// ===============================

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));

    if (target) {
      e.preventDefault();
      target.scrollIntoView({
        behavior: "smooth"
      });
    }
  });
});


// ===============================
// COMMENTS
// ===============================

const commentForm = document.getElementById("commentForm");
const commentList = document.getElementById("commentList");


// Load comments
async function loadComments() {
  if (!commentList) return;

  commentList.innerHTML = "";

  try {
    const snapshot = await db
      .collection("comments")
      .orderBy("createdAt", "asc")
      .get();

    snapshot.forEach(doc => {
      const data = doc.data();

      // Sirf main comments
      if (!data.parentId) {
        const comment = createComment(
          doc.id,
          data.name,
          data.text
        );

        commentList.appendChild(comment);
        loadReplies(doc.id, comment);
      }
    });

  } catch (error) {
    console.error("Comments load error:", error);
  }
}


// Create comment
function createComment(id, name, text) {

  const li = document.createElement("li");
  li.className = "comment-item";

  const div = document.createElement("div");
  div.className = "comment-content";

  const nameElement = document.createElement("strong");
  nameElement.textContent = name;

  const textElement = document.createElement("p");
  textElement.textContent = text;

  const replyButton = document.createElement("button");
  replyButton.textContent = "Reply";
  replyButton.className = "reply-btn";

  const replyBox = document.createElement("div");
  replyBox.className = "reply-box";
  replyBox.style.display = "none";

  replyBox.innerHTML = `
    <input type="text" placeholder="Your name" class="reply-name">
    <textarea placeholder="Write a reply..." class="reply-text"></textarea>
    <button class="post-reply">Post Reply</button>
  `;

  replyButton.addEventListener("click", () => {
    replyBox.style.display =
      replyBox.style.display === "none" ? "block" : "none";
  });


  const postReply = replyBox.querySelector(".post-reply");

  postReply.addEventListener("click", async () => {

    const replyName =
      replyBox.querySelector(".reply-name").value.trim();

    const replyText =
      replyBox.querySelector(".reply-text").value.trim();

    if (!replyName || !replyText) {
      alert("Please enter your name and reply.");
      return;
    }

    try {

      await db.collection("comments").add({
        name: replyName,
        text: replyText,
        parentId: id,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert("Reply posted!");

      replyBox.querySelector(".reply-name").value = "";
      replyBox.querySelector(".reply-text").value = "";

      loadComments();

    } catch (error) {
      console.error(error);
      alert("Reply post nahi ho paya.");
    }

  });


  div.appendChild(nameElement);
  div.appendChild(textElement);
  div.appendChild(replyButton);
  div.appendChild(replyBox);

  li.appendChild(div);

  return li;
}


// Load replies
async function loadReplies(parentId, parentElement) {

  try {

    const snapshot = await db
      .collection("comments")
      .where("parentId", "==", parentId)
      .orderBy("createdAt", "asc")
      .get();

    snapshot.forEach(doc => {

      const data = doc.data();

      const reply = document.createElement("li");
      reply.className = "comment-reply";

      const name = document.createElement("strong");
      name.textContent = data.name;

      const text = document.createElement("p");
      text.textContent = data.text;

      reply.appendChild(name);
      reply.appendChild(text);

      parentElement.appendChild(reply);

    });

  } catch (error) {
    console.error("Reply load error:", error);
  }
}


// Submit main comment
if (commentForm) {

  commentForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const name =
      document.getElementById("commentName").value.trim();

    const text =
      document.getElementById("commentText").value.trim();

    if (!name || !text) {
      alert("Please enter your name and comment.");
      return;
    }

    try {

      await db.collection("comments").add({

        name: name,
        text: text,
        parentId: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()

      });

      alert("Comment posted successfully!");

      document.getElementById("commentName").value = "";
      document.getElementById("commentText").value = "";

      loadComments();

    } catch (error) {

      console.error("Comment error:", error);

      alert("Comment save nahi ho paya. Firebase settings check karein.");

    }

  });

}


// Page load hote hi comments load
loadComments();
