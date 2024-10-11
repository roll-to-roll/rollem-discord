import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import Link from 'next/link'
import React, { Children } from 'react'

const ActiveLink = ({ children, activeClassName, ...props }) => {
  const { asPath } = useRouter()
  const child = Children.only(children)
  const childClassName = child.props.className || ''

  // pages/index.js will be matched via props.href
  // pages/about.js will be matched via props.href
  // pages/[slug].js will be matched via props.as
  const className =
    asPath.startsWith(props.href) || asPath.startsWith(props.as)
      ? `${props.className} ${childClassName} ${activeClassName}`.trim()
      : `${props.className} ${childClassName}`

  return (
    <Link href={props.href} {...props} legacyBehavior>
      {React.cloneElement(child, {
        className: className || null,
      })}
    </Link>
  );
}

ActiveLink.propTypes = {
  activeClassName: PropTypes.string.isRequired,
}

export default ActiveLink
