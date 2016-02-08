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

export default class HomePage extends Component {
  constructor(props) {
    super();

    this.watchID = undefined;
    this.state = {
      position: undefined,
      ssPayload: undefined,
      lastFetchTime: undefined,
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

    let params = {
      lat: coords.latitude,
      lng: coords.longitude,
      date: 'today',
      formatted: 0,
    };
    return fetch('http://api.sunrise-sunset.org/json?' + encodeFormData(null, params))
      .then(response => response.json())
      .then(result => this.setState({ ssPayload: result.results, lastFetchTime: fetchTime }));
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
});