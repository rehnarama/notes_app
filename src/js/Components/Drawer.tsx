import * as React from "react";
import GestureRecognizer from "../GestureRecognizer";

import classes from "./Drawer.module.css";
import Animator from "../Animator";

const MIN_VISIBLE = 48;

const PullupPanel: React.SFC = props => {
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const handleRef = React.useRef<HTMLDivElement>(null);
  const gestureRecognizer = React.useRef<GestureRecognizer | null>(null);
  const animator = React.useRef<Animator>(new Animator());
  const currentVisible = React.useRef<number>(MIN_VISIBLE);
  const latestMomentum = React.useRef<{ x: Number; y: number }>({ x: 0, y: 0 });

  React.useEffect(() => {
    let drawer = drawerRef.current;
    let handle = handleRef.current;

    function updateDrawerHeight() {
      if (drawer) {
        let transformY = window.innerHeight - currentVisible.current;

        drawer.style.transform = `translate3d(0, ${transformY}px, 0)`;
      }
    }

    if (handle) {
      gestureRecognizer.current = new GestureRecognizer(handle, true);
      updateDrawerHeight();

      gestureRecognizer.current.onPan.add(e => {
        currentVisible.current -= e.pageDelta.y;
        currentVisible.current = Math.min(
          currentVisible.current,
          window.innerHeight
        );
        currentVisible.current = Math.max(currentVisible.current, MIN_VISIBLE);
        updateDrawerHeight();

        latestMomentum.current = e.momentum;
      });
      gestureRecognizer.current.onUp.add(e => {
        let target: number;

        if (latestMomentum.current.y < 0) {
          target = window.innerHeight;
        } else {
          target = MIN_VISIBLE;
        }
        animator.current.animateTo(target, 200, currentVisible.current);
      });
    }

    animator.current.onAnimate.add(value => {
      currentVisible.current = value;
      updateDrawerHeight();
    });

    return () => {
      if (gestureRecognizer.current) {
        gestureRecognizer.current.dispose();
      }
    };
  }, [handleRef.current]);

  return (
    <div ref={drawerRef} className={classes.container}>
      <div ref={handleRef} className={classes.handle}>
        <div className={classes.handleDot}></div>
      </div>
      {props.children}
    </div>
  );
};

export default PullupPanel;
