import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import Typography from 'material-ui/Typography'
import './styles.scss'

class ControlPanel extends Component {
  render() {
    return (
      <Paper className='controlPanel'>
        <Typography className='typography' variant='headline'>Controls</Typography>
      </Paper>
    )
  }
}

export default ControlPanel