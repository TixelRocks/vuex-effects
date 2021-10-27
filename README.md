# vuex-effects

Effects is a side effect model for Vuex. Effects use subscribers to provide new sources of actions such as network requests, web socket messages and time-based events.

- [Basic example](https://codesandbox.io/s/vuex-effects-1-92hqr)

## Fork

This repo has been forked from the original and adds some additional features:

- [Including in package.json](#including-in-packagejson)
- [Babel compilation](#building)
- [Correlated effects](#correlated-actions)


## Installation

```bash
$ npm install vuex-effects
```

### Including in package.json

As this is not an npm package, just a forked repo, you will need ot include the project in your `package.json` file like this:

```
"vuex-effects": "github:ianjamieson/vuex-effects",
```

You can achieve this by running:

```baseh
$ npm install ianjamieson/vuex-effects --save
```

## Usage

Import Plugin
```js
import VuexEffects from "vuex-effects";

Vue.use(VuexEffects(store));
```

Use this in component like this

```js
import { mapActions, mapState } from 'vuex';

export default {
  // ...
  effects: {
    actions: {
      getTasksList: {
        after(action, state) {
          localStorage.setItem('tasksList', JSON.stringify(this.tasksList));
        }
      }
    }
  },
  // ...
  computed: {
    ...mapState(['tasksList']),
  },
  mounted() {
    this.getTasksList();
  },
  methods: {
    ...mapActions(['getTasksList']),
  },
};
```

Use this outside component (global effects) like this
```js
// @/src/store/tasksEffects.js
export default {
  effects: {
    actions: {
      getTasksList: {
        after(action, state) {
          localStorage.setItem('tasksList', JSON.stringify(this.tasksList));
        }
      }
    }
  },
};

```
If your effects is outside component (global effects) then you must include your global effects in second parameter
```js
// main.js
// ...
import VuexEffects from "vuex-effects";
import tasksEffects from '@/store/effets/tasksEffects';
Vue.use(VuexEffects(store, [tasksEffects])); 
// ...
```
## Effects Options
### Actions
By default action effects is called before action dispatched if you pass your effect like a function and receives the action descriptor and current store state as arguments.

Let's look at this example effects:
```js
effects: {
    actions: {
        getTasksList(action, state) {
            // this code invokes BEFORE vuex action has finished 
            localStorage.setItem('tasksList', JSON.stringify(this.tasksList));
        }
    }
}
```

If you want to invoke your effects after vuex action, you must to use object notation like this
```js
effects: {
    actions: {
        getTasksList: {
            before(action, state) {
                // this code invokes BEFORE vuex action has finished 
                localStorage.setItem('tasksListBefore', JSON.stringify(this.tasksList));
            },
            after(action, state) {
                // this code invokes AFTER vuex action has finished 
                localStorage.setItem('tasksListAfter', JSON.stringify(this.tasksList));
            }
        }
    }
}
```

By default, new actions effects is added to the end of the chain, so it will be executed after other effects that were added before. This can be overridden by adding `prepend: true` to options, which will add the handler to the beginning of the chain.

Let's look at this example effects:
```js
effects: {
    actions: {
        getTasksList: {
            prepend: true, // this will add your effects to the beginning of the chain
            after(action, state) {
                // this code invokes AFTER vuex action has finished 
                localStorage.setItem('tasksListAfter', JSON.stringify(this.tasksList));
            }
        }
    }
}
```
You can also use `handler` as an alias for `before`
```js
effects: {
    actions: {
        getTasksList: {
            prepend: true, // this will add your effects to the beginning of the chain
            handler(action, state) { // same as before()
                // this code invokes BEFORE vuex action has finished 
                localStorage.setItem('tasksListAfter', JSON.stringify(this.tasksList));
            }
        }
    }
}
```
For using it with namespaced state
```js
effects: {
    actions: {
        'tasks/getTasksList': { // this is an analogy for mapActions argument
            prepend: true, // this will add your effects to the beginning of the chain
            handler(action, state) { // same as before()
                // this code invokes BEFORE vuex action has finished 
                localStorage.setItem('tasksListAfter', JSON.stringify(this.tasksList));
            }
        }
    }
}
```

#### Correlated actions

The forked repo adds additional functionality so that you can correlate dispatched actions with a particular component, let's take a look at an example:

```js
props: {
    name: {
        default: '',
        type: String
    }
},
effects: {
    actions: {
        'tasks/getTasksList': {
            matchComponentProps: ['name'],
            before() {
                // do something for this named component
            },
        },
     }
}
```

You could include the above component like this:

```html
<my-component name="uniqueName"></my-component>
```

Then to ensure that an effect runs for only this component then dispatch within another Vue component like this:

```js
this.$store.dispatch('tasks/getTasksList', { match: [{name: 'uniqueName' }] })
```

**Note**: Correlated actions do not apply for mutations.


### Mutations
Mutations effects is called after every mutation and receives the mutation descriptor and post-mutation state as arguments.
Mutations doesn't have `before` and `after` methods unlike Actions, only the `handler` method is avalable in object notation.


Let's look at this example effects:
```js
effects: {
    mutations: {
        setTasksList(mutation, state) {
            // this code invokes AFTER vuex mutation has finished 
            console.log(mutation.payload)
            console.log(state)
        }
    }
}
```

By default, new mutations effects is added to the end of the chain, so it will be executed after other mutations effects that were added before. This can be overridden by adding `prepend: true` to options, which will add the handler to the beginning of the chain.

Let's look at this example effects:
```js
effects: {
    mutations: {
        getTasksList: {
            prepend: true, // this will add your effects to the beginning of the chain
            handler(mutation, state) {
                // this code invokes AFTER vuex mutation has finished 
                localStorage.setItem('tasksListAfter', JSON.stringify(this.tasksList));
            }
        }
    }
}
```

## Building

If you want to make changes to the code then you can build and watch scripts are in `package.json`:

```bash
$ npm run build
$ npm run watch
```



