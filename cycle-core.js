// Copied from:
// https://gist.github.com/staltz/0e3cdf20a0b7696e7943

let Rx = require(`rx`)

function makeRequestProxies(drivers) {
  let requestProxies = {}
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      requestProxies[name] = new Rx.ReplaySubject(1)
    }
  }
  return requestProxies
}

function callDrivers(drivers, requestProxies) {
  let responses = {}
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      responses[name] = drivers[name](requestProxies[name], name)
    }
  }
  return responses
}

function attachDisposeToRequests(requests, replicationSubscription) {
  Object.defineProperty(requests, `dispose`, {
    enumerable: false,
    value: () => { replicationSubscription.dispose() },
  })
  return requests
}

function makeDisposeResponses(responses) {
  return function dispose() {
    for (let name in responses) {
      if (responses.hasOwnProperty(name) &&
        typeof responses[name].dispose === `function`)
      {
        responses[name].dispose()
      }
    }
  }
}

function attachDisposeToResponses(responses) {
  Object.defineProperty(responses, `dispose`, {
    enumerable: false,
    value: makeDisposeResponses(responses),
  })
  return responses
}

function replicateMany(observables, subjects) {
  return Rx.Observable.create(observer => {
    let subscription = new Rx.CompositeDisposable()
    setTimeout(() => {
      for (let name in observables) {
        if (observables.hasOwnProperty(name) &&
          subjects.hasOwnProperty(name) &&
          !subjects[name].isDisposed)
        {
          subscription.add(
            observables[name]
              .subscribe(subjects[name].asObserver())
          )
        }
      }
      observer.onNext(subscription)
    }, 1)

    return function dispose() {
      subscription.dispose()
      for (let x in subjects) {
        if (subjects.hasOwnProperty(x)) {
          subjects[x].dispose()
        }
      }
    }
  })
}

function run(main, drivers) {
  let requestProxies = makeRequestProxies(drivers)
  let responses = callDrivers(drivers, requestProxies)
  let requests = main(responses)
  let subscription = replicateMany(requests, requestProxies).subscribe()
  let requestsWithDispose = attachDisposeToRequests(requests, subscription)
  let responsesWithDispose = attachDisposeToResponses(responses)
  return [requestsWithDispose, responsesWithDispose]
}

let Cycle = {run, Rx: Rx}

module.exports = Cycle
