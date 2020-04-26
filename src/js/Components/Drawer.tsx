import * as React from "react";
import GestureRecognizer from "../GestureRecognizer";

import classes from "./Drawer.module.css";
import Animator from "../Animator";

const Drawer: React.SFC = props => {
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const handleRef = React.useRef<HTMLDivElement>(null);
  const gestureRecognizer = React.useRef<GestureRecognizer | null>(null);
  const animator = React.useRef<Animator>(new Animator());
  const isVisible = React.useRef<boolean>(true);
  const currentVisible = React.useRef<number>(0);
  const latestMomentum = React.useRef<{ x: Number; y: number }>({ x: 0, y: 0 });

  React.useEffect(() => {
    let drawer = drawerRef.current;
    let handle = handleRef.current;

    if (isVisible.current && drawer && handle) {
      // This will set proper height first render
      currentVisible.current = drawer.scrollHeight - handle.scrollHeight;
    }

    function updateDrawerHeight() {
      if (drawer && handle) {
        const visible = drawer.scrollHeight - currentVisible.current;
        const transformY = visible - handle.scrollHeight;

        drawer.style.transform = `translate3d(0, ${transformY}px, 0)`;
      }
    }

    if (handle) {
      gestureRecognizer.current = new GestureRecognizer(handle, true);

      gestureRecognizer.current.onPan.add(e => {
        if (e.pointerType === "scroll") {
          let target: number;

          if (e.delta.y < 0 && drawer && handle) {
            target = drawer.scrollHeight - handle.scrollHeight;
            isVisible.current = true;
          } else {
            target = 0;
            isVisible.current = false;
          }
          animator.current.animateTo(target, 200, currentVisible.current);
        } else {
          currentVisible.current -= e.pageDelta.y;
          if (drawer && handle) {
            currentVisible.current = Math.min(
              currentVisible.current,
              drawer.scrollHeight - handle.scrollHeight
            );
          }
          currentVisible.current = Math.max(currentVisible.current, 0);
          updateDrawerHeight();

          latestMomentum.current = e.momentum;
        }
      });
      gestureRecognizer.current.onDown.add(e => {
        if (isVisible.current && drawer && handle) {
          // This will compensate in case content height changed while open
          currentVisible.current = drawer.scrollHeight - handle.scrollHeight;
        }
      });
      gestureRecognizer.current.onUp.add(e => {
        let target: number;

        if (latestMomentum.current.y < 0 && drawer && handle) {
          target = drawer.scrollHeight - handle.scrollHeight;
          isVisible.current = true;
        } else {
          target = 0;
          isVisible.current = false;
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
  }, [handleRef.current, drawerRef.current]);

  return (
    <div ref={drawerRef} className={classes.container}>
      <div ref={handleRef} className={classes.handle}>
        <div className={classes.handleDot}></div>
      </div>
      {props.children}
    </div>
  );
};

export default Drawer;
