import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import _ from 'lodash'
import Tts from 'react-native-tts'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 100,
  },
})

const ENGLISH = 'en-US'
const CHINESE = 'zh-CN'
const ENGLISH_TEXT = 'Hello World! This is a demo!'
const CHINESE_TEXT = '严格遵守十不吊，恶劣天气停止作业'

export default class TTSDemo extends React.Component {
  state = {
    ready: false,
    voices: [],
  }

  componentWillMount() {
    Tts.getInitStatus().then(() => {
      this.setState({ ready: true })
      this.setTtsConfig()
      Tts.voices().then(voices => {
        console.log('voices>>>>>>', voices)
        this.setState({ voices })
      })
    })
  }

  setTtsConfig = () => {
    Tts.setDefaultRate(0.5)
    Tts.setDucking(true)
    // Tts.setDefaultPitch(1.5) // 音高
    Tts.addEventListener('tts-start', event => console.log('start', event))
    Tts.addEventListener('tts-finish', event => console.log('finish', event))
    Tts.addEventListener('tts-cancel', event => console.log('cancel', event))
  }

  getVoice = language => {
    const voice = _.find(this.state.voices, item => item.language === language)
    return _.get(voice, 'id')
  }

  playAudio = sentence => {
    if (this.state.ready) {
      Tts.speak(sentence).then(() => console.log('play audio successfully')).catch(error => console.log('play audio failed', error))
    }
  }

  playWithEnglish = () => {
    Tts.setDefaultLanguage(ENGLISH)
    Tts.setDefaultVoice(this.getVoice(ENGLISH))
    this.playAudio(ENGLISH_TEXT)
  }

  playWithChinese = () => {
    Tts.setDefaultLanguage(CHINESE)
    Tts.setDefaultVoice(this.getVoice(CHINESE))
    this.playAudio(CHINESE_TEXT)
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text} onPress={this.playWithEnglish}>
          {ENGLISH_TEXT}
        </Text>
        <Text style={styles.text} onPress={this.playWithChinese}>
          {CHINESE_TEXT}
        </Text>
      </View>
    )
  }
}
