/**
 * You must include the dependency on 'ngMaterial'
 */
angular.module('CookAndCode', ['ngMaterial']);

angular
    .module('CookAndCode')
    .config(function($mdThemingProvider) {
      $mdThemingProvider.theme('default')
          .primaryPalette('indigo')
          .accentPalette('teal')
          .dark();
    })
    .controller('IndexController', IndexController);


function IndexController ($http, $log, $scope, $interval){
  var vm = this;
  var neCoord = {
    lat: 0,
    lng: 0
  };
  var swCoord = {
    lat: 1000,
    lng: 1000
  };
  var map;
  var json_data;
  var end;
  var start;
  var markers = {};
  var all_paths = [];
  var team_colors = {};
  vm.init = false;
  vm.time = 0;

  function getRangeMax(start, end) {
    start_timestamp = new Date(start).getTime();
    end_timestamp = new Date(end).getTime();

    var new_end = end_timestamp-start_timestamp;
    return new_end;
  }

//null to hide, map to show
  function toggleMarker(_id, map) {
    if(markers[_id])
      markers[_id].setMap(map);
  }

  function clearPaths() {
    for(var i=0; i<all_paths.length;i++)
      all_paths[i].setMap(null);
  }


  vm.rebuildMarkers = function(timestamp) {
    neCoord = {
      lat: 0,
      lng: 0
    };
    swCoord = {
      lat: 1000,
      lng: 1000
    };
    if(start) {
      var maxTimestamp = new Date(start);
      maxTimestamp.setSeconds(start.getSeconds() + Math.floor(timestamp/1000));

      setMarkers(maxTimestamp);

      var bounds = new google.maps.LatLngBounds(swCoord, neCoord);
      map.fitBounds(bounds);
    }
  };
  vm.rebuildMarkers(end);
  function generateColor(name) {
    return '#'+CryptoJS.SHA1(name).toString(CryptoJS.enc.Hex).substr(0, 4)+50;
  }

  function pinSymbol(color) {
    return {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#000',
      strokeWeight: 2,
      scale: 1
    };
  }



  function getData(callback) {

    $http.get('http://mock-backend.break-out.org/posts/location').then(function (data) {
      map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        styles:[
          {
            "featureType": "administrative",
            "stylers": [
              { "visibility": "simplified" }
            ]
          },{
            "featureType": "landscape",
            "stylers": [
              { "saturation": -100 }
            ]
          },{
            "featureType": "poi",
            "stylers": [
              { "saturation": -100 }
            ]
          },{
            "featureType": "water",
            "stylers": [
              { "hue": "#0091ff" },
              { "saturation": -34 },
              { "lightness": 9 }
            ]
          },{
            "featureType": "road",
            "stylers": [
              { "hue": "#0066ff" },
              { "lightness": -18 },
              { "saturation": -33 },
              { "gamma": 1.38 },
              { "visibility": "simplified" }
            ]
          },{
            "featureType": "administrative",
            "stylers": [
              { "lightness": -100 }
            ]
          },{
            "featureType": "transit.line",
            "stylers": [
              { "hue": "#005eff" },
              { "lightness": -30 }
            ]
          }
        ]
      });
      var data = data.data;
      vm.data = data.data;
      $log.debug(data);

      map.setCenter(data.data.start);

      json_data = data.data;
      //calculate end and start date


      for(var i=0; i < json_data.teams.length; i++) {
        for(var n=0; n<json_data.teams[i].posts.length;n++) {
          var date = new Date(json_data.teams[i].posts[n].date);
          if(end == null || date > end) {
            end = date;
          }
          if(start == null || date < start)
            start = date;
        }
      }
      vm.max = getRangeMax(start, end);
      vm.time = getRangeMax(start, end);
      callback();
    });
  }

  function setMarkers(maxTimestamps) {
    //clearMarkers();
    clearPaths();
    //set team positions
    for(var i=0; i < json_data.teams.length; i++) {

      var paths = [json_data.start];
      if(team_colors != null && team_colors[json_data.teams[i].name])
        var color = team_colors[json_data.teams[i].name];
      else {
        var color = generateColor(json_data.teams[i].name);
        team_colors[json_data.teams[i].name] = color;
      }

      for(var n=0; n<json_data.teams[i].posts.length;n++) {
        var post = json_data.teams[i].posts[n];

        if(json_data.teams[i].id != vm.team && vm.team != "false") {
          toggleMarker(post.id, null);
          delete markers[post.id];
          continue;
        }

        if(new Date(post.date) > new Date(maxTimestamps)) {
          toggleMarker(post.id, null);
          delete markers[post.id];
          continue;
        } else if(markers[post.id] && markers[post.id].getMap() != null) {

          if(swCoord.lng > post.location.lng)
            swCoord.lng = post.location.lng;

          if(swCoord.lat > post.location.lat)
            swCoord.lat = post.location.lat;

          if(neCoord.lng < post.location.lng)
            neCoord.lng = post.location.lng;

          if(neCoord.lat < post.location.lat)
            neCoord.lat = post.location.lat;
          paths.push({lat:post.location.lat, lng: post.location.lng});
          continue;
        }
        else {
          if(swCoord.lng > post.location.lng)
            swCoord.lng = post.location.lng;

          if(swCoord.lat > post.location.lat)
            swCoord.lat = post.location.lat;

          if(neCoord.lng < post.location.lng)
            neCoord.lng = post.location.lng;

          if(neCoord.lat < post.location.lat)
            neCoord.lat = post.location.lat;
          paths.push({lat:post.location.lat, lng: post.location.lng});
          toggleMarker(post.id, map);
        }

        if(post.picture) {
          var image = "<img src='"+post.picture+"'/>";
        } else {
          var image = null;
        }


        var contentString = '<div id="content">'+
            '<div id="siteNotice">'+
            '</div>'+
            '<h3>'+json_data.teams[i].name+'</h3>'+
            '<div id="bodyContent">'+
            '<p>'+post.text+'</p>'+
            image +
            '</div>'+
            '</div>';

        var infowindow = new google.maps.InfoWindow({
          content: contentString
        });

        var Marker = new google.maps.Marker({
          position: new google.maps.LatLng(post.location.lat, post.location.lng),
          map: map,
          animation: google.maps.Animation.DROP,
          icon: pinSymbol(color),
          title: post.text
        });


        Marker.addListener('mouseover', function(event, marker) {
          infowindow.open(map, this);
        });
        Marker.addListener('mouseout', function(event, marker) {
          infowindow.close();
        });
        markers[post.id] = Marker;
      }


      var flightPath = new google.maps.Polyline({
        path: paths,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
      flightPath.setMap(map);

      all_paths.push(flightPath);


    }
  }

  function initialize() {
    getData(function() {
      setMarkers();
      var directionsDisplay = new google.maps.DirectionsRenderer();// also, constructor can get "DirectionsRendererOptions" object
      directionsDisplay.setMap(map); // map should be already initialized.

      var request = {
        origin : new google.maps.LatLng(48.150639, 11.581024),
        destination :new google.maps.LatLng(44.714383, 21.581024),
        travelMode : google.maps.TravelMode.DRIVING
      };
      var directionsService = new google.maps.DirectionsService();
      //var route = directionsService.route(request, function(response, status) {
      //  console.log(response);
      //  if (status == google.maps.DirectionsStatus.OK) {
      //    directionsDisplay.setDirections(response);
      //  }
      //});
    });
  }
  initialize();


  vm.startTimer = function() {
    vm.time = 0;
    var rangeMax = getRangeMax(start, end);
    var interval = $interval(function() {

      vm.time += 100;
      if(vm.time > rangeMax)
        $interval.cancel(interval);

      vm.rebuildMarkers(vm.time);
    }, 10);
  };



}




