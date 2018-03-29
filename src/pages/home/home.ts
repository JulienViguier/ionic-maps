import { Component, NgZone, enableProdMode } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation';
import { LoadingController } from 'ionic-angular';
//import { AvoidPointsProvider } from '../providers/avoid-points/avoid_points';

enableProdMode();

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  map: any;
  markers: any;
  autocomplete: any;
  GoogleAutocomplete: any;
  GooglePlaces: any;
  geocoder: any
  autocompleteItems_1: any;
  autocompleteItems_2: any;
  loading: any;
  start: any;
  end: any;
  request: any;
  request_2: any;
  avoid_points: any;

  constructor(
    public zone: NgZone,
    public geolocation: Geolocation,
    public loadingCtrl: LoadingController,
    //public avoidPointsService: AvoidPointsProvider
  ) {
    this.geocoder = new google.maps.Geocoder;
    let elem = document.createElement("div");
    this.GooglePlaces = new google.maps.places.PlacesService(elem);
    this.GoogleAutocomplete = new google.maps.places.AutocompleteService();
    this.autocomplete = {
      input_1: '',
      input_2: ''
    };
    this.autocompleteItems_1 = [];
    this.autocompleteItems_2 = [];
    this.markers = [];
    this.loading = this.loadingCtrl.create();
    this.avoid_points = [];
  }

  ionViewDidEnter(){
    this.initMap();
    /*this.avoidPointsService.getAvoidPoints().subscribe(this.avoid_points) => {
      this.avoid_points = avoid_points;
    }*/
  }

  async initMap(){ 
    let resp = await this.geolocation.getCurrentPosition();
    this.map = new google.maps.Map(document.getElementById("map"), {
      center: {lat: resp.coords.latitude, lng: resp.coords.longitude},
      zoom: 20
    }); 
    let icon_base = "assets/imgs/"
    let img = {
      rampe: {
        icon: icon_base + "rampe.png"
      },
      ascenceur: {
        icon: icon_base + "ascenceur.png"
      },
      travaux: {
        icon: icon_base + "travaux.png"
      }
    };
    let features = [
    {
      pos: new google.maps.LatLng(48.792621, 2.363494),
      t: "rampe"
    }, {
      pos: new google.maps.LatLng(48.788058, 2.367054),
      t: "ascenceur"
    }, {
      pos: new google.maps.LatLng(48.788546, 2.366839),
      t: "travaux"
    }
    ];

    for(let i in features){
      let marker = new google.maps.Marker({
        position: features[i].pos,
        map: this.map,
        icon: img[features[i].t].icon
      });
      this.markers.push(marker);
    }
  }  

  tryGeolocation(){
    this.loading.present();
    this.clearMarkers();//remove previous markers
    this.geolocation.getCurrentPosition().then((resp) => {
      let pos = {
        lat: resp.coords.latitude,
        lng: resp.coords.longitude
      };
      let marker = new google.maps.Marker({
        position: pos,
        map: this.map,
        title: 'Je suis ici!'
      });
      this.markers.push(marker);
      this.map.setCenter(pos);
      this.loading.dismiss();

    }).catch((error) => {
      console.log('Error getting location', error);
      this.loading.dismiss();
    });
  }

  updateSearchResults_1(){
    if (this.autocomplete.input_1 == '') {
      this.autocompleteItems_1 = [];
      return;
    }
 
    this.GoogleAutocomplete.getPlacePredictions({ input: this.autocomplete.input_1},
      (predictions, status) => {
        this.autocompleteItems_1 = [];
        if(predictions){
          this.zone.run(() => {
            predictions.forEach((prediction) => {
              this.autocompleteItems_1.push(prediction);
            });
          });
        }
    });
  }

  updateSearchResults_2(){
    if (this.autocomplete.input_2 == '') {
      this.autocompleteItems_2 = [];
      return;
    }
 
    this.GoogleAutocomplete.getPlacePredictions({ input: this.autocomplete.input_2},
      (predictions, status) => {
        this.autocompleteItems_2 = [];
        if(predictions){
          this.zone.run(() => {
            predictions.forEach((prediction) => {
              this.autocompleteItems_2.push(prediction);
            });
          });
        }
    });
  }

  selectSearchResult_1(item){
    this.autocomplete.input_1 = item.description;
    this.autocompleteItems_1 = [];

    this.geocoder.geocode({'placeId': item.place_id}, (results, status) => {
      if(status === 'OK' && results[0]){
        let marker = new google.maps.Marker({
          position: results[0].geometry.location,
          map: this.map
        });
        this.markers.push(marker);
        this.map.setCenter(results[0].geometry.location);
      }
    })
  }

  selectSearchResult_2(item){
    this.autocomplete.input_2 = item.description;
    this.autocompleteItems_2 = [];

    this.geocoder.geocode({'placeId': item.place_id}, (results, status) => {
      if(status === 'OK' && results[0]){
        let marker = new google.maps.Marker({
          position: results[0].geometry.location,
          map: this.map
        });
        this.markers.push(marker);
        this.map.setCenter(results[0].geometry.location);
      }
    })
  }

  clearMarkers(){
    for (var i = 0; i < this.markers.length; i++) {
      console.log(this.markers[i])
      this.markers[i].setMap(null);
    }
    this.markers = [];
  }

  calculateAndDisplayRoute(){
    let first = new google.maps.LatLng(48.792621, 2.363494);
    
    let avoid_points = "(48.7885096, 2.363743999999997)";
    let waypts = [
    {
      location: first,
      stopover: false
    }
    ];
    
    this.start = this.autocomplete.input_1;
    this.end = this.autocomplete.input_2;
    var request_1 = {
      origin: this.start,
      destination: this.end,
      travelMode: google.maps.TravelMode["WALKING"],
      provideRouteAlternatives: true,
    };
    //debugger;
    var request_2 = {
      origin: this.start,
      destination: this.end,
      travelMode: google.maps.TravelMode["WALKING"],
      provideRouteAlternatives: true,
      waypoints: waypts
    }
    this.avoidPoints(request_1, "red");
    this.avoidPoints(request_2, "green");
  }

  avoidPoints(request, color){
    let directionsService = new google.maps.DirectionsService;
    let directionsDisplay = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: color
      }
    });
    directionsDisplay.setMap(this.map);
    //debugger;
    directionsService.route(request, function(response, status){
      if(status == google.maps.DirectionsStatus.OK){
        for(let i = 0, len = response.routes.length; i < len; i++){
          let step_point = response.routes[i].legs[0];
          //console.log(step_point);
          for(let j = 0; j < step_point.steps.length; j++){
            //window.alert(step_point.steps[j].start_location);
            if(step_point.steps[j].start_location == this.avoid_points){
              j = step_point.steps.length - 1;
            }
            else {
              new google.maps.DirectionsRenderer({
                map: this.map,
                directions: response,
                routeIndex: i
              });
              directionsDisplay.setDirections(response);
            }
          }
        }
        //directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    }); 
  }
}