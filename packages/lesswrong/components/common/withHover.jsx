import React, { Component } from 'react';

const withHover = (WrappedComponent) => {
  return class HoverableComponent extends Component {
    state = { hover: false, anchorEl: null }

    handleMouseEnter = (event) => {
      this.setState({ hover: true, anchorEl: event.currentTarget})
    }

    handleMouseLeave = () => {
      this.setState({ hover: false, anchorEl: null })
    }

    render () {
      const props = { hover: this.state.hover, anchorEl: this.state.anchorEl, ...this.props }
      return (
        <div onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
          <WrappedComponent { ...props } />
        </div>
      )
    }
  }
}

export default withHover
