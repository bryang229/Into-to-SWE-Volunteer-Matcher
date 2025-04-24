export function renderSmallListing(listing_data) {
    const card = document.createElement("div"); // creates div tag
    card.className = "listing-card";
    //Uses string to create element of listing
    card.innerHTML = `
    <img src="https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=" alt="Stock image">
    <div class="listing-content">
      <h2>${listing_data.title}</h2>
      <p><strong>Location:</strong> ${listing_data.location}</p>
      <p><strong>Date:</strong> ${listing_data.date}</p>
      <p><strong>Company:</strong> ${listing_data.company_name}</p>
      <p class="tags"><strong>Tags:</strong> ${listing_data.tags.join(", ")}</p>
      <p>${listing_data.description.substring(0, 100)}...</p>
      <button class="view-details-btn">View Details</button>
    </div>
  `;
//   container.appendChild(card);
    return card;
}

export function renderPopUpListing(listing_data, card, loggedIn) {
    const detailOverlay = document.createElement("div");
    detailOverlay.className = "listing-detail-overlay";
    detailOverlay.innerHTML = `
    <div class="detail-content">
      <h2>${listing_data.title}</h2>
      <p><strong>Location:</strong> ${listing_data.location}</p>
      <p><strong>Date:</strong> ${listing_data.date}</p>
      <p><strong>Company:</strong> ${listing_data.company_name}</p>
      <p><strong>Description:</strong> ${listing_data.description}</p>
      <p><strong>Tags:</strong> ${listing_data.tags.join(", ")}</p>
      ${loggedIn
        ? `<button onclick="alert('Apply feature coming soon')">Apply Now</button>`
        : `<p>Please <a href="/templates/auth/login.html">log in</a> to apply.</p>`
      }
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;
    document.body.appendChild(detailOverlay);  
}

