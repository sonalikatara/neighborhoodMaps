var map;
var fsqrLocations = [];
var myLatLng = {lat: 37.3710062, lng: -122.0375932}; // City : Sunnyvale, CA 
var fourSqrUrl =  "https://api.foursquare.com/v2/venues/explore?ll=" + myLatLng.lat + "," + myLatLng.lng + "&section=topPicks&client_id=AC03210WVNTTVRWGF3V4SFLBUAPEDUGCGZEAIQW2T00ASB2R&client_secret=SCYEC5BPCBTKDH1G1EXN2RHSNYA1IAXKULRLRMFRQ200MHUM&v=20160928";
var markers = [];

var largeInfowindow = null;
var defaultIcon = null;
var highlightedIcon = null;
var bounds = null;

// Set the #map height to 100%, was inable to do it using the responsive css 
var body = document.body, html = document.documentElement;
var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
document.getElementById('map').style.height = height + 'px';

function googleError(){
        alert("Couldn't load Gogle Maps. - Please try again !!");
     };

// Define Location class 
var LocationItem = function(title, latLng, address, rating, ratingColor,category, menu, url,id){ 
    this.title = title;
    this.latLng = latLng;
    this.address = address;
    this.rating = rating;
    this.ratingColor = ratingColor;
    this.category = category;
    this.menu = menu;
    this.url = url;
    this.id = id;

};

// Define the Pin class that contains a marker with visibility property
var Pin =  function( title, lat, lng, id, map){
  var self = this;
  var marker;
  self.title = ko.observable(title);
  self.lat = ko.observable(lat);
  self.lng = ko.observable(lng);
  self.map = map;
 
  self.marker = new google.maps.Marker({
    position: new google.maps.LatLng(lat,lng),
    animation: google.maps.Animation.DROP,
    title: title,
    icon: defaultIcon,
    map: map,
    id: id
  });

  self.isVisible = ko.observable(true);
  self.isVisible.subscribe(function(currentState) {
    if (currentState) {
      //self.marker.setMap(self.map);
      self.marker.visible = true;
    } else {
      //self.marker.setMap(null);
      self.marker.visible = false;
    }
  });
};

function initMap(){ 

   if (typeof(google) == 'undefined') {
      alert("Google maps not loading.. Please try again !!");
   } else {


  // Create a map object and specify the DOM element for display.
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 13,
      center: myLatLng
    });
    

    // Style the  location  marker icon.
    defaultIcon = makeMarkerIcon('0091ff');
    // a "highlighted location" marker color for when the user mouses over the marker.
    highlightedIcon = makeMarkerIcon('FFFF24');

    var model = new SearchViewModel();
    ko.applyBindings(model);
     
     // info window to show information on the marker clicked we have one info window at a time 
     // so we initialize a blank InfoWindow to begin with and update it when a marker is clicked.
     largeInfowindow = new google.maps.InfoWindow();  
  };                
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}


//This View Model sends an ajax request to  FourSquare API and gets Recommendations of hotspots 
// around a LatLng which we have set as one in Sunnyvale
// It then initializes Pins( map markers) on the google map that was initialized by the init() function
// SearchViewmodel also handles the Fillering of HotSpot lists and Map Pins based on the user's query.
var SearchViewModel = function(){
  var self = this;
  self.locations = ko.observableArray([]);
  self.pins = ko.observableArray([]);
  self.query = ko.observable('');
  
  var hotSpotRequest = $.ajax({
     url: fourSqrUrl,
  }).done(function( data ) {
    var recommendationsCount = data.response.groups[0].items.length;
    for (var i =0; i< recommendationsCount; i++){
      var venue = data.response.groups[0].items[i].venue;
      var name = data.response.groups[0].items[i].venue.name;
      fsqrLocations[i]= new LocationItem(name, 
                     {lat: data.response.groups[0].items[i].venue.location.lat, lng: data.response.groups[0].items[i].venue.location.lng},
                     venue.location.formattedAddress[0] + ", " + venue.location.formattedAddress[1],
                     venue.rating,
                     venue.ratingColor,
                     venue.categories[0].name,
                     (venue.menu) ? venue.menu.url : '' ,
                     (venue.url) ? venue.url : '',
                     i
                   );
        self.locations.push(fsqrLocations[i]);
       }
      self.initPins();

    //console.log( data);
  }).fail(function( jqXHR, textStatus ) {
    // show error message if the API doesn't load
    alert( "FourSquare Request failed, Please try again : " + textStatus );
  });

  
  self.initPins = function(){
    // The following group uses the location array to create an array of markers on initialize.
    markers = [];
    markerLocations = self.locations();
    
    for (var i = 0; i < markerLocations.length; i++) {
      // Get the position from the location array.
      var lat = markerLocations[i].latLng.lat;
      var lng =  markerLocations[i].latLng.lng;
      var title = markerLocations[i].title;
      // keep the same same ID for locations and markers to easily access the Locations[] data for a marker
      var id = markerLocations[i].id;  
      // Create a marker per location, and put into markers array.
      var pin = new Pin(
        title,
        lat,
        lng,
        id,
        map
      );
      pin.isVisible(true);
      // Push the marker to our array of markers.
      self.pins.push(pin);

      // Create an onclick event to open the large infowindow at each marker.
      pin.marker.addListener('click', function() {
        populateInfoWindow(this, largeInfowindow);
      }); 
      // Two event listeners - one for mouseover, one for mouseout,
      // to change the colors back and forth.
      pin.marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
      });
      pin.marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
      });  
      
    } 
  };
    
 // opens the info window on the marker when a hotspot is selected 
 self.selectLocation = function(){
   
   var search = this.id;
   var setMarker = null;
 
   setMarker = ko.utils.arrayFilter(self.pins(), function(item) {
            return item.marker.id == search;
        });

   populateInfoWindow(setMarker[0].marker, largeInfowindow);
 }



// filter the locations based on the query
  self.filteredLocations = ko.computed(function() {
        var filter = self.query().toLowerCase();
        // close any open info windows
        if (largeInfowindow){
          largeInfowindow.close();
        }
        
       
        if (!filter){
          return self.locations();
        }
        else {
          return ko.utils.arrayFilter(self.locations(),function(item){
          return item.title.toLowerCase().indexOf(filter) !== -1;
        });
      }
    });
  
  // filter the pins based on the query  
  self.filterPins = ko.computed(function(){
     var filter = self.query().toLowerCase();
     var latLngBounds = new google.maps.LatLngBounds();

     if (!filter){
         // set all the pins as visible
         return ko.utils.arrayFilter(self.pins(),function(pin){
          match = true; 
          pin.isVisible(match);
          // add DROP animation to the filtered markers
          pin.marker.setAnimation(google.maps.Animation.DROP);

          // add pin's location to bounds
          latLngBounds.extend(pin.marker.position);
          return match;
        });
        }
        else {
          return ko.utils.arrayFilter(self.pins(),function(pin){
          var match = pin.title().toLowerCase().indexOf(filter) >= 0;
          pin.isVisible(match);
          // add DROP animation to the filtered markers
          pin.marker.setAnimation(google.maps.Animation.DROP);

          // add pin's location to bounds
          latLngBounds.extend(pin.marker.position);
          return match;
      });
      }
     
     self.map.fitBounds(latLngBounds);
   });

};

// populate the info window with details of the location of the marker selected
function populateInfoWindow(marker,infoWindow){
   if (infoWindow.marker != marker) {
    if (infoWindow.marker) {
       // change the  marker icon from highlighted to default marker
       infoWindow.marker.setIcon(defaultIcon);
     };   
    var id = marker.id;
    var content ="";
    // Clear the infowindow content to give the streetview time to load.
    // locations data for this marker exists display it on the infoWindow
    // display menu where available
    if (fsqrLocations[id]){
        locn = fsqrLocations[id];
         content= '<div class="bg-warning"><b>' + marker.title + '</b></div><div class="text-success">';
         content +=  'Rating: <b><span style="background-color: #' + locn.ratingColor + '; padding: 2;">'  +  locn.rating + '</span></b>';
         content +=  '<br>' + locn.address;
         content +=  '<br>' + locn.category;
         if (locn.menu.length >4){
             content += '<span class="displayMenu"> &nbsp; <a href="' + locn.menu + '" target="_blank">Menu</a></span>';
         }
         content +=  '<div class="text-muted small">(Power by Foursquare API)</div></div> ';
         infoWindow.setContent(content);     
    } else
    {
      infowindow.setContent('<div><b>' + marker.title + '</b></div>' +
          '<div>No Details data Found</div>');
    }
    infoWindow.marker = marker;
    // Open the infowindow on the correct marker.
    infoWindow.open(map, marker);
  
    marker.setAnimation(google.maps.Animation.DROP);
    // Making sure the marker property is cleared if the infowindow is closed.
    infoWindow.addListener('closeclick', function() {

      infoWindow.marker = null;

    });
  }
}



