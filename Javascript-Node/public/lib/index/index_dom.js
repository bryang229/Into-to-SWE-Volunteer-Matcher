import { renderSmallListing, renderPopUpListing } from '../listings/render_listing.js';
import { setupNav, loadCreateListings } from '../common/nav_control.js';


//Loads content onto DOM once page is loaded
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("listing-container");
  const accountType = await setupNav();

  //Request our DB for a bunch of listings, thinking of limiting response from server
  try {
    const res = await fetch("/api/listings/");
    const listings = await res.json(); // Turn response into json
    listings.forEach(listing => {
      const card = renderSmallListing(listing);

      card.querySelector(".view-details-btn").addEventListener("click", () => {
        renderPopUpListing(listing, accountType);
      });
      container.appendChild(card);
    });

    await loadCreateListings();
  } catch (err) {
    container.innerHTML = "<p>Failed to load listings. Please try again later.</p>";
    console.error("Error fetching listings:", err);
  }
});


