/* eslint-disable global-require, react/prop-types, react/no-find-dom-node */

import expect from 'expect.js'
import React, {PureComponent} from 'react'
import {findDOMNode} from 'react-dom'
import {spy} from 'sinon'

function getMyComponent(
    styles,
    InnerComponent = ({classes}) => <div className={`${classes.button} ${classes.left}`} />
  ) {
  return injectSheet(styles)(InnerComponent)
}

function classNames(node) {
  const element = findDOMNode(node)
  return element.className.split(/\s/)
}

describe('dynamic styles customization', () => {
  describe('User Classes', () => {
    const color = 'rgb(255, 255, 255)'

    it('should add class for each static rule', () => {
      const styles = {
        left: {
          float: 'left'
        },
        button: {
          color,
          height: 64
        }
      }
      const MyComponent = getMyComponent(styles)
      const node0 = render(<MyComponent />, node)

      expect(classNames(node0)).to.have.length(2)
    })

    it('should split dynamic rule ( with static value) into two separate classes', () => {
      const styles = {
        left: {
          float: 'left'
        },
        button: ({height}) => ({color, height})
      }
      const MyComponent = getMyComponent(styles)
      const node0 = render(<MyComponent height={15} />, node)

      // color is static, so button will have 2 classes
      expect(classNames(node0)).to.have.length(3)
    })

    it('should not allow user classes to override static component classes', () => {
      const styles = {
        left: {
          float: 'left'
        },
        button: {
          color,
          height: 56
        }
      }
      const MyComponent = getMyComponent(styles)
      const node0 = render(<MyComponent classes={{button: 'testLeftClass'}} />, node)

      expect(classNames(node0)).to.have.length(3)
    })

    it('should not allow user classes to override dynamic component classes', () => {
      const styles = {
        left: {
          float: 'left'
        },
        button: ({height}) => ({color, height})
      }
      const MyComponent = getMyComponent(styles)
      const node0 = render(<MyComponent classes={{button: 'testLeftClass'}} height={15} />, node)

      expect(classNames(node0)).to.have.length(4)
    })

    it('should allow user specified static styles to override static component styles', () => {
      const styles = {
        left: {
          float: 'left'
        },
        button: {
          color,
          height: 78
        }
      }
      const MyComponent = getMyComponent(styles)
      const WrappedComponent = getMyComponent({
        button: {height: 89}
      }, MyComponent)
      const node0 = render(<WrappedComponent />, node)
      const style0 = getComputedStyle(findDOMNode(node0))

      expect(style0.float).to.be('left')
      expect(style0.color).to.be(color)
      expect(style0.height).to.be('89px')
    })
  })

  describe('function rules with stylesRoot', () => {
    const color = 'rgb(255, 255, 255)'
    let MyComponent

    beforeEach(() => {
      const InnerComponent = ({classes}) => <div className={`${classes.button} ${classes.left}`} />

      MyComponent = injectSheet({
        left: {
          float: 'left'
        },
        button: ({height}) => ({color, height})
      }, {stylesRoot: 'css.small'})(InnerComponent)
    })

    it('should render styles properly', () => {
      const css = {
        small: {
          height: 100
        }
      }
      const node0 = render(<MyComponent css={css} />, node)

      const style0 = getComputedStyle(findDOMNode(node0))
      expect(style0.color).to.be(color)
      expect(style0.height).to.be('100px')
    })

    it('should not update dynamic styles unnecessarily', () => {
      /* eslint-disable react/no-multi-comp, react/prefer-stateless-function */
      class Container extends PureComponent {
        constructor(props) {
          super(props)
          this.state = {
            dummyKey: 'dummyValue'
          }
        }

        render() {
          const {css} = this.props
          return (
            <div>
              <MyComponent css={css} />
            </div>
          )
        }
      }
      /* eslint-enable */
      const css = {
        small: {
          height: 100
        }
      }
      const component = render(<Container css={css} />, node)
      const update = spy(StyleSheet.prototype, 'update')

      component.setState({dummyKey: 'someOtherValue'})
      // no properties were changed, hence update should not be called
      expect(update.callCount).to.equal(0)
    })
  })

  describe('function rules without stylesRoot', () => {
    const color = 'rgb(255, 0, 255)'
    let MyComponent

    beforeEach(() => {
      const InnerComponent = ({classes}) => <div data-inner-component className={`${classes.button} ${classes.left}`} />

      MyComponent = injectSheet({
        left: {
          float: 'left'
        },
        button: props => ({color, height: props.css.small.height})
      })(InnerComponent)
    })

    it('should render styles properly', () => {
      const css = {
        small: {
          height: 200
        }
      }
      const node0 = render(<MyComponent css={css} />, node)
      const style0 = getComputedStyle(findDOMNode(node0))

      expect(style0.color).to.be(color)
      expect(style0.height).to.be('200px')
    })

    it('should update dynamic styles properly', () => {
      /* eslint-disable react/no-multi-comp, react/prefer-stateless-function */
      class Container extends PureComponent {
        constructor(props) {
          super(props)
          this.state = {
            height: 105
          }
        }

        render() {
          const {css} = this.props

          css.small.height = this.state.height

          return (
            <div>
              <MyComponent css={css} />
            </div>
          )
        }
      }
      /* eslint-enable */
      const css = {
        small: {
          width: 10
        }
      }
      const node0 = render(<Container css={css} />, node)

      node0.setState({height: 210})

      const style0 = getComputedStyle(findDOMNode(node0).querySelector('[data-inner-component]'))
      expect(style0.color).to.be(color)
      expect(style0.height).to.be('210px')
    })
  })
})
