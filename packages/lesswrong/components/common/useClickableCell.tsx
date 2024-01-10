import React, { FC, ReactNode, MouseEvent, useCallback } from "react";
import { useNavigate } from "../../lib/reactRouterWrapper";
import { useTracking } from "../../lib/analyticsEvents";

export type ClickableCellProps = {
  href: string,
  onClick?: never,
  infiniteScrollPathQuery?: string,
} | {
  href?: never,
  onClick: (e: MouseEvent<HTMLDivElement>) => void,
  infiniteScrollPathQuery?: string,
};

export const useClickableCell = ({href, onClick, infiniteScrollPathQuery}: ClickableCellProps) => {
  const navigate = useNavigate();
  // Note that we only trigger this event if an href is provided
  const { captureEvent } = useTracking({eventType: "linkClicked", eventProps: {to: href}})

  // We make the entire "cell" a link. In sub-items need to be separately
  // clickable then wrap them in an `InteractionWrapper`.
  const wrappedOnClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick(e);
    } else if (e.metaKey || e.ctrlKey) {
      captureEvent();
      window.open(href, "_blank");
    } else {
      if (infiniteScrollPathQuery) {
        const infiniteScrollPosition = JSON.stringify({
          pathQuery: infiniteScrollPathQuery,
          scrollPosition: window.scrollY,
        })
        localStorage.setItem('infiniteScrollPosition', infiniteScrollPosition);
      }
      captureEvent();
      navigate(href);
    }
  }, [navigate, href, onClick, captureEvent, infiniteScrollPathQuery]);

  return {
    onClick: wrappedOnClick,
  };
}

/**
 * By default, clicking anywhere on the clickable cell will navigate to the target
 * href. If an element needs to be clickable without doing this it should be wrapped
 * in an InteractionWrapper.
 */
export const InteractionWrapper: FC<{
  href?: string,
  children: ReactNode,
  className?: string,
}> = ({href, children, className}) => {
  const navigate = useNavigate();
  const onClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    if (href) {
      navigate(href);
    }
  }, [navigate, href]);
  return (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  );
}
