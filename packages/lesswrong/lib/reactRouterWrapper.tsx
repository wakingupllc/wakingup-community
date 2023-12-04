/*import * as reactRouter3 from 'react-router';

export const Link = reactRouter3.Link;

export const withRouter = reactRouter3.withRouter;*/

import React from 'react';
import { useTracking } from '../lib/analyticsEvents';
// eslint-disable-next-line no-restricted-imports
import * as reactRouter from 'react-router';
// eslint-disable-next-line no-restricted-imports
import * as reactRouterDom from 'react-router-dom';
import { HashLink, HashLinkProps } from "../components/common/HashLink";
import { classifyHost, getUrlClass } from './routeUtil';
import { parseQuery } from './vulcan-core/appContext'
import qs from 'qs'


export const withRouter = (WrappedComponent: AnyBecauseTodo) => {
  const WithRouterWrapper = (props: AnyBecauseTodo) => {
    return <WrappedComponent
      routes={[]}
      location={{pathname:""}}
      router={{location: {query:"", pathname:""}}}
      {...props}
    />
  }
  return reactRouter.withRouter(WithRouterWrapper);
}

type LinkProps = {
  to?: HashLinkProps['to']|null
  href?: string|null
  onMouseDown?: HashLinkProps['onMouseDown']
  onClick?: HashLinkProps['onClick']
  rel?: string
  eventProps?: Record<string, string>
  className?: string
  dangerouslySetInnerHTML?: {__html: string}
  target?: string
  smooth?: boolean,
  id?: string
  children?: React.ReactNode,
};

const isLinkValid = (props: LinkProps): props is HashLinkProps => {
  return typeof props.to === "string" || typeof props.to === "object";
};

export const Link = ({eventProps, ...props}: LinkProps) => {
  const { captureEvent } = useTracking({eventType: "linkClicked", eventProps: {to: props.to, ...(eventProps ?? {})}})
  const handleClick = (e: AnyBecauseTodo) => {
    captureEvent(undefined, {buttonPressed: e.button})
    props.onMouseDown && props.onMouseDown(e)
  }

  if (!isLinkValid(props)) {
    // eslint-disable-next-line no-console
    console.error("Props 'to' for Link components only accepts strings or objects, passed type: ", typeof props.to)
    return <span>Broken Link</span>
  }
  
  const {to, href, ...otherProps} = props;
  const destinationUrl = to||href;

  if (destinationUrl && typeof destinationUrl==='string' && isAbsoluteLink(destinationUrl)) {
    return <a href={destinationUrl} {...otherProps} onMouseDown={handleClick}/>
  } else {
    return <HashLink {...props} onMouseDown={handleClick}/>
  }
}

export const QueryLink: any = (reactRouter.withRouter as any)(({query, location, staticContext, merge=false, history, match, ...rest}: AnyBecauseTodo) => {
  // Merge determines whether we do a shallow merge with the existing query parameters, or replace them completely
  const newSearchString = merge ? qs.stringify({...parseQuery(location), ...query}) : qs.stringify(query)
  return <reactRouterDom.Link
    {...rest}
    to={{...location, search: newSearchString}}
  />
})

function isOffsiteLink(url: string): boolean {
  if (url.startsWith("http:") || url.startsWith("https:")) {
    const URLClass = getUrlClass();
    const parsedUrl = new URLClass(url);
    return classifyHost(parsedUrl.host) !== "onsite";
  } else {
    return false;
  }
}

function isAbsoluteLink(url: string): boolean {
  return url.startsWith("http:") || url.startsWith("https:");
}

export const Redirect = reactRouter.Redirect;

export const useHistory = reactRouter.useHistory;
