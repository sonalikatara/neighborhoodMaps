# Neighborhood Maps

Neighborhood maps is a single-page application featuring a map of Sunnyvale.

The map has markers to identify popular locations or places in the city.

The markers are annimated when the user mouses over them.

I have used FourSquare API to provide additional information about each of these locations, including color-coded ratings and if available a link to it's menu. This detailed information is shown on a info window when a marker is selected or a list item associated with it is selected.

The page has a search/filter box to easily discover these locations and a listview to support simple browsing of all locations. The list view and markers update accordingly in realtime.

I have used Bootstrap and some custom css to make the site responsive. A hamburger menu icon is used to show or hide the list on small screen.

I have used Google Maps API and Four Square API to show maps and locations. These API's are called asyncronously and a message is shown in case the call to the API's fail.