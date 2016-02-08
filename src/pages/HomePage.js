'use strict';
import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  View
} from 'react-native';
import encodeFormData from 'GoldenHour/src/lib/encodeFormData';

const ONE_MINUTE = 60 * 1000;

// TODO (hallucinogen): move networking logic into other files
export default class HomePage extends Component {
  constructor(props) {
    super();

    this.watchID = undefined;
    this.state = {
      position: undefined,
      ssPayload: undefined,
      lastFetchTime: undefined,
      weather: undefined,
    }
    this.fetchPromise = Promise.resolve(null);
  }

  componentDidMount() {
    this.watchID = navigator.geolocation.watchPosition((position) => {
      this.setState({position}, () => {
        // Chain the request in Promise chain so that we don't fetch every fucking single
        // time the location changes.
        this.fetchPromise = this.fetchPromise.then(() => this._fetchSunsetTime());
      });
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 });
  }

  _fetchSunsetTime(): Promise {
    let coords = this.state.position.coords;
    let fetchTime = new Date();

    // Terminate early.
    if (!coords) {
      return Promise.resolve(null);
    }
    if (this.state.ssPayload && (fetchTime - this.state.lastFetchTime) < ONE_MINUTE) {
      // If we have data and we fetched it just recently, don't fetch again.
      return Promise.resolve(null);
    }

    let params1 = {
      lat: coords.latitude,
      lng: coords.longitude,
      date: 'today',
      formatted: 0,
    };
    let params2 = {
      lat: coords.latitude,
      lon: coords.longitude,
      // TODO (hallucinogen): store API key inside NODE_ENV
      appid: 'some API key',
    }
    
    let promise1 = fetch('http://api.sunrise-sunset.org/json?' + encodeFormData(null, params1))
      .then(response => response.json());
    // TODO (hallucinogen): this API call is giga expensive. We might want to store somewhere.
    let promise2 = fetch('http://api.openweathermap.org/data/2.5/weather?' + encodeFormData(null, params2))
      .then(response => response.json());
    return Promise.all([promise1, promise2])
      .then((results) => {
        // Assume both successfully fetched.
        this.setState({
          ssPayload: results[0].results,
          weather: (results[1].weather ? results[1].weather[0].description : null),
          lastFetchTime: fetchTime,
        })
      });
  }

  render() {
    let ssPayload = this.state.ssPayload || {};
    let sunrise = '-';
    let sunriseGH = '-';
    let sunriseBH = '-';
    let sunset = '-';
    let sunsetGH = '-';
    let sunsetBH = '-';

    if (ssPayload.sunrise) {
      let sunriseDate = new Date(ssPayload.sunrise);
      sunrise = sunriseDate.toLocaleTimeString();
      sunriseBH = new Date(new Date(sunriseDate).setMinutes(sunriseDate.getMinutes() - 20)).toLocaleTimeString();
      sunriseGH = new Date(new Date(sunriseDate).setMinutes(sunriseDate.getMinutes() + 20)).toLocaleTimeString();

      let sunsetDate = new Date(ssPayload.sunset);
      sunset = sunsetDate.toLocaleTimeString();
      sunsetBH = new Date(new Date(sunsetDate).setMinutes(sunsetDate.getMinutes() + 20)).toLocaleTimeString();
      sunsetGH = new Date(new Date(sunsetDate).setMinutes(sunsetDate.getMinutes() - 20)).toLocaleTimeString();
    }

    return (
      <View style={styles.container}>
        <Text style={styles.weatherText}>{this.state.weather || `Can't determine weather`}</Text>

        <View style={styles.ssContainer}>
          <Text style={styles.ssText}>Sunrise Blue Hour: { sunriseBH }</Text>
          <Text style={styles.ssText}>Sunrise: { sunrise }</Text>
          <Text style={styles.ssText}>Sunrise Golden Hour: { sunriseGH }</Text>
        </View>

        <View style={styles.ssContainer}>
          <Text style={styles.ssText}>Sunset Golden Hour: { sunsetGH }</Text>
          <Text style={styles.ssText}>Sunset: { sunset }</Text>
          <Text style={styles.ssText}>Sunset Blue Hour: { sunsetBH }</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  ssContainer: {
    marginBottom: 25,
  },
  ssText: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  weatherText: {
    textAlign: 'center',
    fontSize: 20,
    margin: 25,
  },
});