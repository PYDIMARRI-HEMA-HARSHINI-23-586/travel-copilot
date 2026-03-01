async function getHotelRecommendations(destination) {
  const hotels = {
    Dubai: [
      { name: "Burj Al Arab", price: "₹45,000/night", rating: "5⭐", location: "Jumeirah" },
      { name: "Rove Downtown", price: "₹8,500/night", rating: "4⭐", location: "Downtown" }
    ],
    Singapore: [
      { name: "Marina Bay Sands", price: "₹55,000/night", rating: "5⭐", location: "Bayfront" },
      { name: "Hotel G", price: "₹12,000/night", rating: "4⭐", location: "Bugis" }
    ],
    Delhi: [
      { name: "The Taj Mahal Hotel", price: "₹18,000/night", rating: "5⭐", location: "Man Singh Road" },
      { name: "IBIS New Delhi", price: "₹5,500/night", rating: "4⭐", location: "Aerocity" }
    ],
    London: [
      { name: "The Ritz London", price: "£650/night", rating: "5⭐", location: "Piccadilly" },
      { name: "CitizenM", price: "£180/night", rating: "4⭐", location: "Bankside" }
    ],
    Mumbai: [
      { name: "Taj Mahal Palace", price: "₹22,000/night", rating: "5⭐", location: "Colaba" },
      { name: "Trident Bandra Kurla", price: "₹12,000/night", rating: "5⭐", location: "BKC" }
    ],
    "New York": [
      { name: "The Plaza", price: "$850/night", rating: "5⭐", location: "5th Ave" },
      { name: "Arlo NoMad", price: "$250/night", rating: "4⭐", location: "Manhattan" }
    ]
  };

  return hotels[destination] || [
    { name: "Generic Grand Hotel", price: "Varies", rating: "4⭐", location: "City Center" },
    { name: "Budget Inn", price: "Varies", rating: "3⭐", location: "Near Airport" }
  ];
}

module.exports = getHotelRecommendations;
