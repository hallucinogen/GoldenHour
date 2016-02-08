'use strict';
import React, {
  AppRegistry,
  Component,
  StyleSheet,
} from 'react-native';
import HomePage from 'GoldenHour/src/pages/HomePage';

class GoldenHour extends Component {
  render() {
    return (
      <HomePage />
    );
  }
}

AppRegistry.registerComponent('GoldenHour', () => GoldenHour);
