// Typed From Cyclejs video tutorial

// Also see this 92 line cycle-core implementation
// https://gist.github.com/staltz/0e3cdf20a0b7696e7943

// Cycle JS idea is to separate business logic into a pure function (main())
// and effects into Drivers
// Cycle JS's run() function takes main and the dirvers as inputs
// and runs the App. There is a slight trick to solve the chicken and egg
// problem of circular relationship between main and drivers

// main() takes sources as inputs and returns sinks
const main = (sources) => {
  const click$ = sources.DOM
  return {
    DOM: click$.startWith(null).map(() =>
      xs.periodic(1000)
        .fold(prev => prev + 1, 0)
      ).flatten()
      .map( i =>
        // Here we could return JSX if we want React
         `Seconds elapsed: ${i}`),
    log: xs.periodic(2000)
      .fold(prev => prev + 1, 0)
  }
}

function domDriver(text$) {
  //********************************************************************
  // 1. subscribe to Application stream and use the data to update DOM
  //********************************************************************
  text$.subscribe({
    next: str => {
      const elem = document.querySelector('#app')
      elem.textContect = str; // Update DOM
    }
  })
  //********************************************************************
  // 2. Return a stream that Application can subscribe to for
  //    events from the DOM (User)
  //********************************************************************
  const domSource = fromEvent(document, 'click')
  return domSource;
}

funciton logDriver(msg$) {
  msg$.subscribe({
    next: msg => {
      console.log(msg)
    }
  })
}
function run (mainFn, drivers) {
  const fakeDOMSinks = {}
  Object.keys(fakeDOMSinks).forEach(driver => {
    fakeDOMSinks[driver] = xs.create();
  }
  const domSources = Object.keys(drivers).map(key =>
    drivers[key](sinks[key], fakeDOMSinks[key])
  )
  const sinks = mainFn(domSources)
  Object.keys(sinks).forEach(key => fakeDOMSinks[key].imitate(sinks[key]))

}

run(main, {
  DOM: domDriver,
  log: logDriver
})
