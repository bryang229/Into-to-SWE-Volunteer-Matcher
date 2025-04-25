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
      <p><strong>Company:</strong> ${listing_data.companyName}</p>
      <p class="tags"><strong>Tags:</strong> ${listing_data.tags.join(", ")}</p>
      <p>${listing_data.description.substring(0, 100)}...</p>
      <button class="view-details-btn">View Details</button>
    </div>
  `;
  //   container.appendChild(card);
  return card;
}

export function renderPopUpListing(listing_data, accountType) {
  const detailOverlay = document.createElement("div");

  console.log(accountType);
  console.log(listing_data.id)
  detailOverlay.className = "listing-detail-overlay";
  detailOverlay.innerHTML = `
    <div class="detail-content">
      <h2>${listing_data.title}</h2>
      <p><strong>Location:</strong> ${listing_data.location}</p>
      <p><strong>Date:</strong> ${listing_data.date}</p>
      <p><strong>Company:</strong> ${listing_data.companyName}</p>
      <p><strong>Description:</strong> ${listing_data.description}</p>
      <p><strong>Tags:</strong> ${listing_data.tags.join(", ")}</p>
 ${accountType === "volunteer"
      ? `<a href="/templates/volunteer/apply.html?listingId=${listing_data.id}"><button>Apply Now</button></a>`
      : accountType === "company"
        ? `<p>You must be a <strong>volunteer</strong> to apply.</p>`
        : `<p>Please <a href="/templates/auth/login.html" style="color: #000000;"><strong>[log in]</strong></a> to apply.</p>`
    }
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;
  document.body.appendChild(detailOverlay);
}

