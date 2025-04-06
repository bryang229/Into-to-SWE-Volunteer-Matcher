document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("listing-container");

  fetch("/api/listings")
    .then(res => res.json())
    .then(listings => {
      listings.forEach(listing => {
        const card = document.createElement("div");
        card.className = "listing-card";

        card.innerHTML = `
          <img src="https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=" alt="Stock image">
          <div class="listing-content">
            <h2>${listing.title}</h2>
            <p><strong>Location:</strong> ${listing.location}</p>
            <p><strong>Date:</strong> ${listing.date}</p>
            <p><strong>Company:</strong> ${listing.company}</p>
            <p class="tags"><strong>Tags:</strong> ${listing.tags.join(", ")}</p>
            <p>${listing.description}</p>
          </div>
        `;

        container.appendChild(card);
      });
    })
    .catch(err => {
      container.innerHTML = "<p>Failed to load listings. Please try again later.</p>";
      console.error("Error fetching listings:", err);
    });
});