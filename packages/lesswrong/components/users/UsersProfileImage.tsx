import React, { FC, memo } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import classNames from "classnames";
import rng from "../../lib/seedrandom";

export type ProfileImageFallback = "initials";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    borderRadius: 6,
  },
  wrapper: {
    display: "flex",
    alignItems: "center",
  },
  "@keyframes profile-image-loader": {
    "0%": {
      backgroundPosition: "right",
    },
  },
  loadingPlaceholder: {
    background: `linear-gradient(
      90deg,
      rgba(0,0,0,0) 33%,
      rgba(255,255,255,0.25) 50%,
      rgba(0,0,0,0) 66%
    ) ${theme.palette.grey[500]}`,
    backgroundSize: "300% 100%",
    animation: "profile-image-loader 1s infinite",
  },
  initalText: {
    color: "#fff", // For both light and dark mode
    fill: "#fff",
    lineHeight: 1,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
});

const MIN_HUE = 100;
const MAX_HUE = 360;
const MIN_SATURATION = 30;
const MAX_SATURATION = 65;
const MIN_LIGHTNESS = 38;
const MAX_LIGHTNESS = 40;

const randPercent = (rand: ReturnType<typeof rng>, min = 0, max = 100) =>
  (Math.abs(rand.int32()) % (max - min)) + min;

const userBackground = (displayName: string): string => {
  const rand = rng(displayName);
  const h = randPercent(rand, MIN_HUE, MAX_HUE);
  const s = randPercent(rand, MIN_SATURATION, MAX_SATURATION);
  const l = randPercent(rand, MIN_LIGHTNESS, MAX_LIGHTNESS);
  return `hsl(${h}deg ${s}% ${l}%)`;
}

const getTextSizeMultiplier = (text: string) => {
  switch (text.length) {
  case 1:  return 0.5;
  case 2:  return 0.45;
  default: return 0.34;
  }
}

const InitialFallback: FC<{
  displayName: string,
  size: number,
  className?: string,
  classes: ClassesType,
}> = memo(({displayName, size, className, classes}) => {
  displayName ??= "";
  const initials = displayName.split(/[\s-_.()]/).map((s) => s?.[0]?.toUpperCase());
  const text = initials.filter((s) => s?.length).join("").slice(0, 3);
  const background = userBackground(displayName);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      width={`${size}px`}
      height={`${size}px`}
      viewBox={`0 0 ${size} ${size}`}
      className={classNames(classes.root, className)}
    >
      <rect
        fill={background}
        width={size}
        height={size}
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
      />
      <text
        className={classes.initalText}
        x="50%"
        y="50%"
        alignmentBaseline="middle"
        textAnchor="middle"
        fontSize={size * getTextSizeMultiplier(text)}
        fontWeight="600"
        dy=".1em"
        dominantBaseline="middle"
      >
        {text}
      </text>
    </svg>
  );
});

export type UserWithProfileImage = {
  displayName: string,
  profileImageId?: string,
}

const UsersProfileImage = ({user, size, fallback="initials", className, classes}: {
  user?: UserWithProfileImage,
  size: number,
  fallback?: ProfileImageFallback,
  className?: string,
  classes: ClassesType,
}) => {
  const [loading, setLoading] = React.useState(true);

  if (!user?.displayName) {
    return (
      <picture className={classes.wrapper}>
        <div
          className={classNames(
            classes.root,
            classes.loadingPlaceholder,
            className,
          )}
          style={{width: size, height: size}}
        />
      </picture>
    );
  }

  if (user.profileImageId) {
    return (
      <Components.CloudinaryImage2
        width={size}
        height={size}
        imgProps={{q: "100", dpr: "2"}}
        publicId={user.profileImageId}
        loading={loading}
        setLoading={setLoading}
        className={classNames(
          classes.root,
          className,
          { [classes.loadingPlaceholder]: loading },
        )}
        wrapperClassName={classes.wrapper}
      />
    );
  }

  if (fallback === "initials") {
    return (
      <picture className={classes.wrapper}>
        <InitialFallback
          displayName={user.displayName}
          size={size}
          className={className}
          classes={classes}
        />
      </picture>
    );
  }

  return null;
}

const UsersProfileImageComponent = registerComponent(
  "UsersProfileImage",
  UsersProfileImage,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    UsersProfileImage: typeof UsersProfileImageComponent
  }
}
