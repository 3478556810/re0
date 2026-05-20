# vue-resize-sensor
detect container resizing. 
* event based
* no window.onresize
* no interval/timeout detection
* no CSS modifications
* no Javascript-Framework dependency

## Example
```
<template>
  <div>
    <resize-sensor @resize="resize"></resize-sensor>
  </div>
</template>

```

## API

### props

#### initial <sup>Boolean<sup>
Request an initial size event.


### events

#### @resize <sup>Object<sup>
A size object `{ width, height }`


## Browser support
Same browser support as [Vue.js 2](https://github.com/vuejs/vue/blob/dev/README.md)

## Note
since v2.x, the script is exported as esm.

## Credits
[<img src="https://www.franck-freiburger.com/FF.png" width="16"> Franck Freiburger](https://www.franck-freiburger.com)
