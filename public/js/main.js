document.addEventListener("DOMContentLoaded", function () {
  fetch("/posts")
    .then((response) => response.json())
    .then((posts) => {
      const postContainer = document.getElementById("posts");
      postContainer.innerHTML = posts
        .map((post) => {
          const categoryClass = post.category
            ? `post--${post.category.toLowerCase().replace(/\s+/g, "-")}`
            : "";

          return `
            <div class="post-card ${categoryClass}">
              ${post.image ? `<img class="post-img" src="${post.image}" alt="${post.title}"/>` : ""}
              <h3 class="post-category">${post.category || "No Category"}</h3>
              <a href="/post-details/${encodeURIComponent(post.title.trim().replace(/\s+/g, "-").toLowerCase())}">
                <h2 class="post-title">${post.title}</h2>
              </a>
              <div class="post-desc">${post.content}</div>
              <a href="/post-details/${encodeURIComponent(post.title.trim().replace(/\s+/g, "-").toLowerCase())}" class="read-more">Read More</a>
            </div>
          `;
        })
        .join("");
    })
    .catch((error) => {
      console.error("Error fetching posts:", error);
      document.getElementById("posts").innerHTML = "<p>Error fetching posts.</p>";
    });
});

$(document).ready(function () {
  $(".filter-item").click(function () {
    let value = $(this).attr("data-filter").toLowerCase().replace(/\s+/g, "-");

    if (value === "all") {
      $(".post-card").show(1000);
    } else {
      $(".post-card").not(".post--" + value).hide(1000);
      $(".post-card").filter(".post--" + value).show(1000);
    }

    $(".filter-item").removeClass("active-filter");
    $(this).addClass("active-filter");
  });
});
