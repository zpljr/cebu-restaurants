let map;
let infoWindow;
let placesService;
let directionsService;
let directionsRenderer;
let restaurants = [];
let markers = [];
let restaurantTypes = [];
let excludedRestaurantTypes = ["restaurant", "food", "point_of_interest", "establishment"];

const filterDropdown = document.getElementById('filter');
const showRestaurantsBtn = document.getElementById('showRestaurantsBtn');
const restaurantListContainer = document.getElementById('restaurantList');
const directionsPanel = document.getElementById('directionsPanel');

// Initialize
function init() {
  // The location of cebu
  const cebu = new google.maps.LatLng(10.2653721,123.9154529);

  // The map, centered at cebu
  map = new google.maps.Map(document.getElementById("map"), { 
    zoom: 10,
    center: cebu,
  });

  const request = {
    location: cebu,
    radius: '20000',
    type: ['restaurant']
  };

  placesService = new google.maps.places.PlacesService(map);
  placesService.nearbySearch(request, searchCallback);

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  
  directionsRenderer.setPanel(directionsPanel);
  infoWindow = new google.maps.InfoWindow();
}

function updateDisplay() {
  directionsRenderer.setMap(null);
  showMarkers(filter.value);
  showRestaurants({ filter: filter.value });
  filterDropdown.parentElement.hidden = false;
  showRestaurantsBtn.parentElement.parentElement.hidden = true;
  restaurantListContainer.hidden = false;
  directionsPanel.hidden = true;
}

function searchCallback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    restaurants = results;
    showMarkers('all');
    showRestaurants({ filter: 'all' });
    restaurantTypes = [...new Set(restaurants.map(restaurant => restaurant.types).reduce((prev, curr) => curr.concat(prev)))].filter(type => !excludedRestaurantTypes.includes(type));
    restaurantTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type.split('_').map(text => text.charAt(0).toUpperCase() + text.substring(1)).join(' ');
      filter.appendChild(option);
    });
    filter.addEventListener('change', () => {
      markers.forEach(marker => marker.setMap(null));
      updateDisplay();
    });
    // placesService.getDetails({ placeId: restaurants[0].place_id }, (result, status) => {
    //   if (status == google.maps.places.PlacesServiceStatus.OK) {
    //     console.log(result)
    //   }
    // });
    console.log(restaurants)
  }
}

function createMarker(location, placeId) {
  const marker = new google.maps.Marker({
    position: location,
    map: map,
  });
  
  marker.addListener("click", () => {
    filterDropdown.parentElement.hidden = true;
    showRestaurantsBtn.parentElement.parentElement.hidden = false;
    showRestaurants({ placeId });
  });

  markers.push(marker);
}

function showMarkers(filter) {
  if (restaurants && restaurants.length > 0) {
    let list = restaurants;
    if (filter !== 'all') list = restaurants.filter(restaurant => restaurant.types.includes(filter));
    list.forEach(restaurant => createMarker(restaurant.geometry.location, restaurant.place_id))
  }
}

function createRestaurantCard(details) {
  const card = document.createElement('div');
  card.className = 'card mb-3';
  const { name, vicinity } = details;

  let img = '';
  if (details.photos) {
    img = `<img src="${details.photos[0].getUrl()}" class="card-img-top" alt="">`;
  }

  card.innerHTML = `
    ${img}
    <div class="card-body">
      <h5 class="card-title">${name}</h5>
      <p class="card-text text-muted">${vicinity}</p>
      <button class="btn btn-primary btn-sm">Directions</button>
    </div>
  `;

  return card;
}

function showRestaurants(obj) {
  restaurantListContainer.innerHTML = '';
  if (restaurants && restaurants.length > 0) {
    let list = restaurants;
    if (obj.placeId) list = [restaurants.find(restaurant => restaurant.place_id === obj.placeId)];
    else if (obj.filter !== 'all') list = restaurants.filter(restaurant => restaurant.types.includes(obj.filter));
    list.forEach(item => { 
      const card = createRestaurantCard(item);
      restaurantListContainer.appendChild(card);
      card.addEventListener('click', () => calcRoute(item.geometry.location))
    });
  }
}

function calcRoute(destination) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let origin = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        const request = {
          origin,
          destination,
          travelMode: 'DRIVING'
        };
        directionsService.route(request, (result, status) => {
          if (status == 'OK') {
            directionsRenderer.setMap(map);
            directionsRenderer.setDirections(result);
            markers.forEach(marker => marker.setMap(null));
            showRestaurantsBtn.parentElement.parentElement.hidden = false;
            filterDropdown.parentElement.hidden = true;
            directionsPanel.hidden = false;
            restaurantListContainer.hidden = true;
          }
        });
      },
      () => {
        handleLocationError(true, infoWindow, map.getCenter());
      }
    );
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

showRestaurantsBtn.addEventListener('click', updateDisplay);

window.init = init;