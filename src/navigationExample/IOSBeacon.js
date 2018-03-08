import React from 'react'
import { View, Text, DeviceEventEmitter, Platform } from 'react-native'
import _ from 'lodash'
import { Actions } from 'react-native-router-flux'
import Beacons from 'react-native-beacons-manager'

const region = {
  identifier: '',
  // uuid: 'B5B182C7-EAB1-4988-AA99-B5C1517008D9', // April Brother
  // uuid: 'E2C56DB5-DFFB-48D2-B060-D0F5A71096E0', // Seekcy
  uuid: 'E2C56DB5-DFFB-48D2-B060-D0F5A71096E0',
}

const isIOS = Platform.OS === 'ios'

export default class IOSBeacon extends React.Component {
  componentWillMount() {
    if (isIOS) {
      Beacons.requestWhenInUseAuthorization()
    }
    Beacons.startRangingBeaconsInRegion(region)
      .then(() => console.log('startRanging successfully'))
      .catch(error => console.log('error when startRangingBeaconsInRegion>>>>>', error))
    Beacons.startMonitoringForRegion(region)
      .then(() => console.log('start monitoring successfully'))
      .catch(error => console.log('start monitoring error>>>', error))

    if (isIOS) {
      Beacons.startUpdatingLocation()
      Beacons.shouldDropEmptyRanges(true)
    }

    this.beaconsDidRange = DeviceEventEmitter.addListener('beaconsDidRange', data => {
      console.log('data>>>', data)
      if (isIOS) {
        console.log('beaconsDidRange data>>>>>>>>>>', _.get(data, 'beacons[0].accuracy'))
      } else {
        console.log('beaconsDidRange data>>>>>>>>>>', _.get(data, 'beacons[0].distance'))
      }

    })
    this.regionDidEnter = DeviceEventEmitter.addListener('regionDidEnter', data => console.log('regionDidEnter data>>>>>>: ', data))
    this.regionDidExit = DeviceEventEmitter.addListener('regionDidExit', data => console.log('regionDidExit data>>', data))
  }

  componentWillUnMount() {
    Beacons.stopRangingBeaconsInRegion(region)
      .then(() => console.log('stop ranging beacons in region successfully'))
      .catch(error => console.log('stop ranging beacons in region failed', error))
    Beacons.stopMonitoringForRegion(region)
      .then(() => console.log('stop monitoring successfully'))
      .catch(error => console.log('stop monitoring failed', error))
    if (isIOS) {
      Beacons.stopUpdatingLocation()
    }
    if (this.regionDidEnter) { this.regionDidEnter.remove() }
    if (this.beaconsDidRange) { this.beaconsDidRange.remove() }
    if (this.regionDidExit) { this.regionDidExit.remove() }
  }

  render() {
    return (
      <View>
        <Text onPress={Actions.pageC}>Go to PageC</Text>
      </View>
    )
  }
}
