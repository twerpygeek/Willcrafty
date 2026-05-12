import React from "react";
import { Composition } from "remotion";
import { WillCraftyOnboarding } from "./WillCraftyOnboarding.jsx";

export const Root = () => {
  return (
    <Composition
      id="WillCraftyOnboarding"
      component={WillCraftyOnboarding}
      durationInFrames={480}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
