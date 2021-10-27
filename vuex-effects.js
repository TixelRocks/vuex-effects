import _every from 'lodash/every';
import _some from 'lodash/some';

const VuexEffects = (store, effectsList = []) => ({
  install(VueGlobal) {
    function matchComponentProps(path, action) {
      const effectMatchers = path[action.type].matchComponentProps;
      if(effectMatchers && effectMatchers.length > 0
        && !_every(effectMatchers, (propertyToMatch) => {
          if (!action?.payload?.match) {
            console.error('[vuex-effects] matchComponentProps is set and expects the action sends a payload with match');
            return false;
          }

          if (typeof this?.[propertyToMatch] === undefined) {
            console.error(`[vuex-effects] matchComponentProps is set and expects the component to have props "${effectMatchers}". "${propertyToMatch}", doesn't exist, you need to set this in the component props`);
            return false;
          }

          return _some(action.payload.match, (match) => {
            if (!match?.[propertyToMatch]) {
              console.error(`[vuex-effects] matchComponentProps is set and expects the action to send, "${propertyToMatch}" as a property in the match array, this action is sending "${Object.keys(match)}"`);
              return false;
            }

            return match[propertyToMatch] === this[propertyToMatch];
          });

          })) {
          // do not execute the action as it needs to match all properties
          return true;
      }
    }

    function callActionEffect(effectsPath, stage, action, state, prepend = false) {
      const actionsPath = effectsPath.actions;

      // matchComponentProps will match the component properties from the component
      // and the action
      if (matchComponentProps.apply(this, [actionsPath, action])) {
        return;
      }

      // exit if effect's prepend not the same as subscriber
      if (typeof actionsPath[action.type] === 'object') {
        if (!!actionsPath[action.type].prepend !== prepend) {
          return;
        }
      } else if (typeof actionsPath[action.type] === 'function' && prepend) {
        return;
      }

      if (stage === 'before') {
        // if effect is function
        if (typeof actionsPath[action.type] === 'function') {
          actionsPath[action.type].apply(this, [action, state]);
          return;
        }

        // if effect is object and it has handler function
        if (typeof actionsPath[action.type] === 'object'
            && typeof actionsPath[action.type].handler === 'function') {
          actionsPath[action.type].handler.apply(this, [action, state]);
          return;
        }

        // if effect is object with before function
        if (typeof actionsPath[action.type] === 'object'
            && typeof actionsPath[action.type][stage] === 'function') {
          actionsPath[action.type][stage].apply(this, [action, state]);
        }
      } else if (stage === 'after') {
        // if effect is object with after function
        if (typeof actionsPath[action.type] === 'object'
            && typeof actionsPath[action.type][stage] === 'function') {
          actionsPath[action.type][stage].apply(this, [action, state]);
        }
      }
    }

    function callMutationEffect(effectsPath, mutation, state, prepend = false) {
      const mutationsPath = effectsPath.mutations;

      // exit if effect's prepend not the same as subscriber
      if (typeof mutationsPath[mutation.type] === 'object') {
        if (!!mutationsPath[mutation.type].prepend !== prepend) {
          return;
        }
      } else if (typeof mutationsPath[mutation.type] === 'function' && prepend) {
        return;
      }

      // if effect is function
      if (typeof mutationsPath[mutation.type] === 'function') {
        mutationsPath[mutation.type].apply(this, [mutation, state]);
        return;
      }

      // if effect is object and it has handler function
      if (typeof mutationsPath[mutation.type] === 'object'
          && typeof mutationsPath[mutation.type].handler === 'function') {
        mutationsPath[mutation.type].handler.apply(this, [mutation, state]);
      }
    }

    // action wrapper fn
    function actionFn(effectsPath, effectActionsList, prepend = false) {
      return {
        before: (action, state) => {
          if (effectActionsList.includes(action.type)) {
            callActionEffect.apply(this, [effectsPath, 'before', action, state, prepend]);
          }
        },
        after: (action, state) => {
          if (effectActionsList.includes(action.type)) {
            callActionEffect.apply(this, [effectsPath, 'after', action, state, prepend]);
          }
        },
      };
    }

    // mutation wrapper fn
    function mutationFn(effectsPath, effectActionsList, prepend = false) {
      return (mutation, state) => {
        if (effectActionsList.includes(mutation.type)) {
          callMutationEffect.apply(this, [effectsPath, mutation, state, prepend]);
        }
      };
    }

    // register effects for component
    VueGlobal.mixin({
      beforeCreate() {
        const { effects } = this.$options;
        if (effects) {
          const subscribers = [];
          const effectTypes = Object.keys(effects);
          effectTypes.forEach((effectType) => {
            const effectActionsList = Object.keys(effects[effectType]);

            // subscribe to two identical events, with 'prepend' option and without it
            // so we have only two subscriber for all events
            // for actions and mutations
            switch (effectType) {
              case 'actions': {
                subscribers.push(
                    store.subscribeAction(actionFn.apply(this, [this.$options.effects, effectActionsList])),
                    store.subscribeAction(actionFn.apply(this, [this.$options.effects, effectActionsList, true]), { prepend: true }),
                );
                break;
              }
              case 'mutations': {
                subscribers.push(
                    store.subscribe(mutationFn.apply(this, [this.$options.effects, effectActionsList])),
                    store.subscribe(mutationFn.apply(this, [this.$options.effects, effectActionsList, true]), { prepend: true }),
                );
                break;
              }
              default: {
                throw new Error(`[vuex-effects] Unrecognized effect section ${effectType} \n Maybe you mean 'actions' or 'mutations'?`);
              }
            }
          });

          this.$once('hook:beforeDestroy', () => {
            subscribers.forEach((subscriber) => subscriber());
          });
        }
      },
    });

    // register global effects
    effectsList.forEach((effectsItem) => {
      const { effects } = effectsItem;

      const effectTypes = Object.keys(effects);
      effectTypes.forEach((effectType) => {
        const effectActionsList = Object.keys(effects[effectType]);

        // subscribe to two identical events, with 'prepend' option and without it
        // so we have only two subscriber for all events
        // for actions and mutations
        switch (effectType) {
          case 'actions': {
            store.subscribeAction(actionFn.apply(effectsItem, [effectsItem.effects, effectActionsList]));
            store.subscribeAction(actionFn.apply(effectsItem, [effectsItem.effects, effectActionsList, true]), { prepend: true });
            break;
          }
          case 'mutations': {
            store.subscribe(mutationFn.apply(effectsItem, [effectsItem.effects, effectActionsList]));
            store.subscribe(mutationFn.apply(effectsItem, [effectsItem.effects, effectActionsList, true]), { prepend: true });
            break;
          }
          default: {
            throw new Error(`[vuex-effects] Unrecognized effect section ${effectType}`);
          }
        }
      });
    });
  },
});

export default VuexEffects;
