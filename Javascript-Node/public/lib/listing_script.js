//Loads content onto DOM once page is loaded
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("listing-container");

  //Request our DB for a bunch of listings, thinking of limiting response from server
  try {
    const res = await fetch("/api/listings");
    const listings = await res.json(); // Turn response into json
    listings.forEach(listing => {
      const card = document.createElement("div"); // creates div tag
      card.className = "listing-card";
      //Uses string to create element of listing
      card.innerHTML = `
      <img src="https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=" alt="Stock image">
      <div class="listing-content">
        <h2>${listing.title}</h2>
        <p><strong>Location:</strong> ${listing.location}</p>
        <p><strong>Date:</strong> ${listing.date}</p>
        <p><strong>Company:</strong> ${listing.company}</p>
        <p class="tags"><strong>Tags:</strong> ${listing.tags.join(", ")}</p>
        <p>${listing.description.substring(0, 100)}...</p>
        <button class="view-details-btn">View Details</button>
      </div>
    `;

      card.querySelector(".view-details-btn").addEventListener("click", () => {
        const loggedIn = "false";

        const detailOverlay = document.createElement("div");
        detailOverlay.className = "listing-detail-overlay";
        detailOverlay.innerHTML = `
        <div class="detail-content">
          <h2>${listing.title}</h2>
          <p><strong>Location:</strong> ${listing.location}</p>
          <p><strong>Date:</strong> ${listing.date}</p>
          <p><strong>Company:</strong> ${listing.company}</p>
          <p><strong>Description:</strong> ${listing.description}</p>
          <p><strong>Tags:</strong> ${listing.tags.join(", ")}</p>
          ${loggedIn
            ? `<button onclick="alert('Apply feature coming soon')">Apply Now</button>`
            : `<p>Please <a href="/templates/login.html">log in</a> to apply.</p>`
          }
          <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
      `;
        document.body.appendChild(detailOverlay);
      });
      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = "<p>Failed to load listings. Please try again later.</p>";
    console.error("Error fetching listings:", err);
  }
});


