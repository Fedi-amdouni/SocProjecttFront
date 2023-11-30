import {Component, ViewEncapsulation, OnInit, AfterViewInit} from '@angular/core';
import tt from '@tomtom-international/web-sdk-maps';
import {Observable, Subscriber} from "rxjs";
import {environment} from "../../environments/environment";
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements AfterViewInit {
  map: any;

  constructor() {
  }

  public ngAfterViewInit(): void {
    this.loadMap();
  }

  private getCurrentPosition(): any {
    return new Observable((observer: Subscriber<any>) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position: any) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          observer.complete();
        });
      } else {
        observer.error();
      }
    });
  }

  // Function to convert longitude to x tile coordinate
  private lon2tile(lon: number, zoom: number): number {
    return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  }

// Function to convert latitude to y tile coordinate
  private lat2tile(lat: number, zoom: number): number {
    return Math.floor(
      ((1 -
          Math.log(
            Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
          ) /
          Math.PI) /
        2) *
      Math.pow(2, zoom)
    );
  }

  private loadMap(): void {
    this.map = tt.map({
      key: environment.tomtom.key,
      container: 'map'
    });



    this.map.addControl(new tt.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true

      },
    }));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: any) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const zoom = 12;
          // Calculate x and y coordinates for traffic flow tiles
          const x = this.lon2tile(userLocation.lng, zoom);
          const y = this.lat2tile(userLocation.lat, zoom);

          var marker = new tt.Marker( {
            color: 'red',
          })
            .setLngLat([userLocation.lng, userLocation.lat])
            .addTo(this.map);


          this.map.flyTo({
            center: userLocation,
            zoom: 17,
          });

          const trafficFlowURL = `https://api.tomtom.com/traffic/map/4/tile/flow/relative0-dark/${zoom}/${x}/${y}.png?tileSize=512&key=${environment.tomtom.key}`;

          // Add traffic flow as a raster layer
          this.map.addSource('trafficFlow', {
            type: 'raster',
            tiles: [trafficFlowURL],
            tileSize: 512,
          });

          this.map.addLayer({
            id: 'trafficFlow',
            type: 'raster',
            source: 'trafficFlow',
            minzoom: 6,
            maxzoom: 18,
            layout: {
              visibility: 'visible',
            },
          });
          this.map.on('trackuserlocationstart', (e: any) => {
            console.log('Tracking user location started');
            // Additional actions when tracking starts, if needed
          });
        },

        (error: any) => {
          console.error('Error getting user location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported');
    }
  }










}
