import React from 'react'
import { View, Text } from 'react-native'

export default class TTSDemo extends React.Component {
  playTTS = () => {

  }
  render() {
    return (
      <View>
        <Text onPress={this.playTTS}>Press me to play TTS audio</Text>
      </View>
    )
  }
}
