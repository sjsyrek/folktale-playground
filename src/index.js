/**
 * Error Handling with Folktale
 * 
 * Folktale provides algebraic data types in the style of statically typed,
 * functional programming languages for use in JavaScript. The three types of
 * use for error handling are, in order of sophistication, `Maybe`, `Result`,
 * and `Validation`. This document describes some of the functionality of these
 * data types, including several functions that are undocumented by part of the
 * library and potentially useful.
 */

/**
 * `Maybe` - Models the presence or absence of a value.
 *
 * `Maybe` is a sum type with two values, `Just` and `Nothing`. `Just` represents
 * the presence of a value for an operation that may not return a value.
 * `Nothing` represents the absence of a value for the same operation.
 * `matchWith` implements FP-style pattern matching.
 * `chain` allows you to chain together functions that return `Maybe` values.
 *
 * const m = new Map()
 * m.set('steve', 39)
 * m.set('laura', 38)
 * m.get('steve')                                       // => 39
 * m.get('steven')                                      // => undefined
 * safeGet(m, 'steve')                                  // => Just({ value: 39 })
 * safeGet(m, 'steven')                                 // => Nothing({})
 * const maybeJust = safeGet(m, 'steve')                // => Just({ value: 39 })
 * const maybeNothing = safeGet(m, 'steven')            // => Nothing({})
 * handleMaybe(maybeJust, handleJust, handleNothing)    // => 'The age is 39.'
 * handleMaybe(maybeNothing, handleJust, handleNothing) // => 'No age available for given key.'
 *
 * const b = new Map()
 * b.set(39, 'benefits')
 * b.set(47, 'benefits')
 * const getBenefit = age => b.get(age) ? Just(b.get(age)) : Nothing()
 *
 * safeGet(m, 'steve').chain(getBenefit)  // => Just({ value: "benefits" })
 * safeGet(m, 'laura').chain(getBenefit)  // => Nothing({})
 * safeGet(m, 'steven').chain(getBenefit) // => Nothing({})
 */

const Maybe = require('folktale/maybe')

const { Just, Nothing } = Maybe

const safeGet = (map, key) => map instanceof Map && map.get(key)
  ? Just(map.get(key))
  : Nothing()

const handleMaybe = (maybe, justHandler, nothingHandler) => maybe.matchWith({
  Just: ({ value }) => justHandler(value),
  Nothing:       () => nothingHandler() 
})

const handleJust = value => `The age is ${value}.`

const handleNothing = () => `No age available for given key.`

/**
 * Exception checks with `Maybe`
 *
 * Basic checks for bad data where a `Maybe` value would be appropriate. 
 *
 * nullCheck(null)           // => Nothing({})
 * nullCheck(0)              // => Just({ value: 0 })
 * nullCheck(undefined)      // => Just({ value: undefined })
 *
 * undefinedCheck(undefined) // => Nothing({})
 * undefinedCheck(0)         // => Just({ value: 0 })
 * undefinedCheck(null)      // => Just({ value: null })
 *
 * emptyStringCheck('')      // => Nothing({})
 * emptyStringCheck(0)       // => Just({ value: 0 })
 * emptyStringCheck([])      // => Just({ value: []})
 * emptyStringCheck(' ')     // => Just({ value: " " })
 * emptyStringCheck([] + []) // => Nothing({}) // wat?
 *
 * blankStringCheck(' ')     // => Nothing({})
 * blankStringCheck(' \n ')  // => Nothing({})
 *
 * nanCheck(NaN)             // => Nothing({})
 * nanCheck(0)               // => Just({ value: 0 })
 *
 * truthyCheck(null)         // => Nothing({})
 * truthyCheck(undefined)    // => Nothing({})
 * truthyCheck(NaN)          // => Nothing({})
 * truthyCheck('')           // => Nothing({})
 * truthyCheck(0)            // => Nothing({})
 * truthyCheck(false)        // => Nothing({})
 * truthyCheck(true)         // => Just({ value: true })
 * truthyCheck(' ')          // => Just({ value: " " })
 * truthyCheck({})           // => Just({ value: {} })
 *
 * infinityCheck(Infinity)   // => Nothing({})
 * infinityCheck(-Infinity)  // => Nothing({})
 * infinityCheck(0)          // => Nothing({})
 *
 * exceptionCheck(null)      // => Nothing({})
 * exceptionCheck(undefined) // => Nothing({})
 * exceptionCheck(NaN)       // => Nothing({})
 * exceptionCheck('')        // => Nothing({})
 * exceptionCheck(' ')       // => Nothing({})
 * exceptionCheck(0)         // => Just({ value: 0 })
 */

const nullCheck = value => value === null
  ? Nothing()
  : Just(value)

const undefinedCheck = value => value === undefined
  ? Nothing()
  : Just(value)

const nanCheck = value => isNaN(value)
  ? Nothing()
  : Just(value)

const emptyStringCheck = value => value === ''
  ? Nothing()
  : Just(value)

const blankStringCheck = value => typeof value === 'string' && value.trim() === '' 
  ? Nothing()
  : Just(value)

const truthyCheck = value => value
  ? Just(value)
  : Nothing()

const posInfinityCheck = value => value === Infinity
  ? Nothing()
  : Just(value)

const negInfinityCheck = value => value === -Infinity
  ? Nothing()
  : Just(value)

const badStringCheck = value => emptyStringCheck(value).chain(blankStringCheck)

const infinityCheck = value => posInfinityCheck(value).chain(negInfinityCheck)

const exceptionCheck = value =>
  nullCheck(value)
  .chain(undefinedCheck)
  .chain(badStringCheck)
  .chain(nanCheck)

/**
 * `Result` - Models the result of operations that may fail.
 *
 * `Result` is a sum type with two values, `Ok` and `Error`. A value wrapped in
 * `Ok` represents a successful computation, like a `Just` value of type
 * `Maybe`. An `Error` wraps an error message or other value, however, which
 * makes this type more informative than `Maybe`, which is sometimes desirable.
 * `getOrElse` extracts a value from a `Result` or returns a default value.
 * `merge` returns whatever is wrapped in the `Result`.
 *
 * safeDivide(10, 5)                         // => Result.Ok({ value: 2 })
 * safeDivide(10, 0)                         // => Result.Error({ value: "Division by zero." })
 *
 * safeDivide(10, 5).getOrElse('Try again.') // => 2
 * safeDivide(10, 0).getOrElse('Try again.') // => 'Try again.'
 *
 * safeDivide(10, 5).merge()                 // => 2
 * safeDivide(10, 0).merge()                 // => 'Division by zero.'
 */

const Result = require('folktale/result')

const safeDivide = (dividend, divisor) => divisor === 0
  ? Result.Error('Division by zero.')
  : Result.Ok(dividend / divisor)

/**
 * Exception checks with `Result`
 *
 * Checks for bad data with error messags, an improved version of the above.
 * `chain` works the same way as for `Maybe`.
 * 
 * exceptionCheckR(null)      // => Result.Error({ value: "Error: value is null." }) 
 * exceptionCheckR(undefined) // => Result.Error({ value: "Error: value is undefined." }) 
 * exceptionCheckR(NaN)       // => Result.Error({ value: "Error: value is not a number." })
 * exceptionCheckR('')        // => Result.Error({ value: "Error: value is an empty string." })
 * exceptionCheckR(' ')       // => Result.Error({ value: "Error: value is a blank string." })
 * exceptionCheckR(Infinity)  // => Result.Error({ value: "Error: value is Infinity." })
 * exceptionCheckR(-Infinity) // => Result.Error({ value: "Error: value is -Infinity." })
 * exceptionCheckR(0)         // => Result.Ok({ value: 0 }) 
 */

const nullCheckR = value => value === null
  ? Result.Error('Error: value is null.')
  : Result.Ok(value)

const undefinedCheckR = value => value === undefined
  ? Result.Error('Error: value is undefined.')
  : Result.Ok(value)

const nanCheckR = value => isNaN(value)
  ? Result.Error('Error: value is not a number.')
  : Result.Ok(value)

const emptyStringCheckR = value => value === ''
  ? Result.Error('Error: value is an empty string.')
  : Result.Ok(value)

const blankStringCheckR = value => typeof value === 'string' && value.trim() === ''
  ? Result.Error('Error: value is a blank string.')
  : Result.Ok(value)

const posInfinityCheckR = value => value === Infinity
  ? Result.Error('Error: value is Infinity.')
  : Result.Ok(value)

const negInfinityCheckR = value => value === -Infinity
  ? Result.Error('Error: value is -Infinity.')
  : Result.Ok(value)

const badStringCheckR = value => emptyStringCheckR(value).chain(blankStringCheckR)

const infinityCheckR = value => posInfinityCheckR(value).chain(negInfinityCheckR)

const exceptionCheckR = value =>
  nullCheckR(value)
  .chain(undefinedCheckR)
  .chain(badStringCheckR)
  .chain(nanCheckR)
  .chain(infinityCheckR)

/**
 * Error handling with `Result`
 *
 * `orElse` allows more general error handling than `.getOrElse`. Like `chain`,
 * successes return an `Ok` value, but in this case errors invoke execution of
 * the given function.
 * `matchWith` implements FP-style pattern matching.
 *
 * parseData(0)     // => Result.Ok({ value: 0 })
 * parseData('')    // => Result.Ok({ value: "" })
 * parseData(true)  // => Result.Ok({ value: true })
 * parseData(null)  // => Result.Error({ value: "null is not a value I can parse." })
 *
 * const d1 = parseData(0)
 * const d2 = parseData(null)
 * errorHandler(d1) // => 'Ok: 0'
 * errorHandler(d2) // => 'Error: null is not a value I can parse.'
 */

const parseNumber = value => typeof value === 'number'
  ? Result.Ok(value)
  : Result.Error(`${value} is not a number.`)

const parseString = value => typeof value === 'string'
  ? Result.Ok(value)
  : Result.Error(`${value} is not a string.`)

const parseBoolean = value => typeof value === 'boolean'
  ? Result.Ok(value)
  : Result.Error(`${value} is not a boolean.`)

const parseData = value =>
  parseNumber(value)
  .orElse(_ => parseString(value))
  .orElse(_ => parseBoolean(value))
  .orElse(_ => parseError(value))

const parseError = value => Result.Error(`${value} is not a value I can parse.`)

// Same as the above but with a slightly cleaner presentation using `mapError`.
const parseDataMap = value =>
  parseNumber(value)
  .orElse(_ => parseString(value))
  .orElse(_ => parseBoolean(value))
  .mapError(_ => `${value} is not a value I can parse.`)

const errorHandler = result => result.matchWith({
  Ok:    ({ value }) => `Ok: ${value}`,
  Error: ({ value }) => `Error: ${value}`
})

/**
 * `Validation` - models the result of operations that may fail and aggregates the failures.
 *
 * `Validation` is a sum type with two values, `Success` and `Failure`. When
 * validating values using this datatype, the result is wrapped in either one or
 * the other, depending on the result (i.e. success or failure) of the
 * corresponding validation function. When composed together, the final value of
 * these functions will either be `Success` wrapping the last successfully validated
 * value or `Failure` wrapping an aggregation of those values.
 */

const Validation = require('folktale/validation')

const { Success, Failure, collect } = Validation

// Constant values

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/

const PASSWORD_REGEX = /\W/ // must contain a special symbol

const PASSWORD_MIN = 8

// Sample data

const makeForm = (email = '', password = '') => ({ email, password })

const testForm1 = makeForm()

const testForm2 = makeForm('bademail', 'badpassword')

const testForm3 = makeForm('good@email.com', 'badpassword')

const testForm4 = makeForm('good@email.com', 'abc123+')

const testForm5 = makeForm('good@email.com', 'abc123+-=') // only valid form

/**
 * Validation rules
 * 
 * These are the basic elements of validation. They can be combined to form more
 * complex validation rules and reused for multiple fields. Note that the
 * Failure error messages are enclosed in singleton arrays. This makes it easier
 * to iterate over a collection of Failures. The values would otherwise just be
 * stringified and appended.
 */ 

// Validates a field that is nonempty.
const notEmpty = (field, value) => value.trim()
  ? Success(value)
  : Failure([`You must enter a value for ${field}.`])

// Validates a field with a minimum input length.
const minLength = (field, min, value) => value.length > min
  ? Success(value)
  : Failure([`Field <${field}> must contain a minimum of ${min} characters`])

// Validates a field that matches a given regular expression.
const matches = (field, regexp, value) => regexp.test(value)
  ? Success(value)
  : Failure([`Field <${field}> does not match expression ${regexp}.`])

/**
 * Field validations
 * 
 * These are possible validation rules for specific form fields. They are made
 * by concatenating the above validation rules together. They will also return
 * either `Success` or a collection of `Failure`s.
 */

const isValidEmail = (field, value) =>
  notEmpty(field, value).concat(
    matches(field, EMAIL_REGEX, value))

const isValidPassword = (field, value) =>
  notEmpty(field, value).concat(
    minLength(field, PASSWORD_MIN, value)).concat(
      matches(field, PASSWORD_REGEX, value))

/**
 * Form validations
 * 
 * These are sample form validations. Given an object representing a form, these
 * functions use the field validations above to validate an entire form and
 * return either Success or a collection of Failures.
 * `collect` validates an array of validation values, which looks nicer.
 *
 * validateForm(testForm1)        // => Failure({ value: [...] })
 * validateForm(testForm5)        // => Success({ value: "abc123+-=" })
 * validateFormCollect(testForm1) // => Failure({ value: [...] })
 * validateFormCollect(testForm5) // => Success({ value: "abc123+-=" })
 *
 * It is possible to validate multiple forms at once, though the aggregated
 * failure values may be difficult to distinguish without further discrimination
 * of types of error.
 *
 * validateForms([testForm1,
 *                testForm2,
 *                testForm3])     // => Failure({ value: [...] }) 
 */

const validateForm = form =>
  isValidEmail('email', form.email).concat(
    isValidPassword('password', form.password))

const validateFormCollect = form => collect([
  isValidEmail('email', form.email),
  isValidPassword('password', form.password)
])

const validateForms = forms => collect(forms.map(form => validateForm(form)))

/**
 * Validation handling
 * 
 * Once you have your Validation value, you need to do something with it. That
 * is, after a form is validated, you will want to specify a code path to follow
 * depending on the outcome.
 * `matchWith` implements FP-style pattern matching.
 * 
 * const v1 = validateForm(testForm1)
 * const v5 = validateForm(testForm5)
 * handleValidation(v1) // => 'Failure: [...]'
 * handleValidation(v5) // => 'Success: abc123+-='
 */

const handleValidation = validation => validation.matchWith({
  Success: validation => successHandler(validation.value), // Success: ({ value }) => successHandler(value)
  Failure: validation => failureHandler(validation.value)  // Failure: ({ value }) => failureHandler(value)
})

const successHandler = value => `Success: ${value}`

const failureHandler = value => `Failure: [\n${value.join(",\n")}\n]`

/**
 * Reducing values
 * 
 * Reduce or fold over Validation values, similar to Array.reduce.
 * `fold` applies a function to a Validation value and accumulates the results.
 * 
 * const v1 = validateForm(testForm1)
 * const v5 = validateForm(testForm5)
 * validateWithFold(testForm1)  // => 'Failure: [...]'
 * validateWithFold(testForm5)  // => 'Success: abc123+-='
 * handleValidationWithFold(v1) // => 'Failure: [...]'
 * handleValidationWithFold(v5) // => 'Success: abc123+-='
 */

const validateWithFold = form => validateForm(form).fold(failureHandler, successHandler)

const handleValidationWithFold = validation => validation.fold(failureHandler, successHandler)

/**
 * Transforming values
 *
 * Apply functions to Validation values, similar to Array.map.
 * `map` transforms `Success` values.
 * `mapFailure` transforms `Failure` values.
 * `bimap` can transform either `Success` or `Failure` values.
 * 
 * const v1 = validateForm(testForm1)
 * const v5 = validateForm(testForm5)
 * validateSuccess(v1)  // => 'Failure'
 * validateFailure(v5)  // => 'Success'
 * validateSimplify(v1) // => 'Failure'
 * validateSimplify(v5) // => 'Success'
 */
const successTransformation = _ => 'Success'

const failureTransformation = _ => 'Failure'

const validateSuccess = validation => validation.map(successTransformation)

const validateFailure = validation => validation.mapFailure(failureTransformation)

const validateSimplify = validation => validation.bimap(failureTransformation, successTransformation)

/**
 * Combining Maybe with Validation
 * 
 * Sometimes it's useful to use `Maybe` value along with `Validation` values.
 * The functions below could easily be rewritten to return `Success` or
 * `Failure` instead, but these versions are more portable.
 * `fromMaybe` converts `Maybe` values into `Validation` values.
 *
 * isRequiredMatch('Steve', 'name') // => Success({ value: "Steve" })
 * isRequiredMatch('', 'name')      // => Failure({ value: [{ name: "name is required" }] }) 
 * isRequiredMap(null, 'name')      // => Failure({ value: [{ name: "name is required" }] })
 * isRequiredMap(undefined, 'name') // => Failure({ value: [{ name: "name is required" }] })
 */

const isRequiredMatch = (field, fieldName) => Validation.fromMaybe(exceptionCheck(field)).matchWith({
  Success: ({ value }) => Success(value),
  Failure: _           => Failure([{[fieldName]: `${fieldName} is required`}])
})

// This is the same function as above but with less redundancy.
const isRequiredMap = (field, fieldName) => Validation.fromMaybe(exceptionCheck(field))
  .mapFailure(_ => [{[fieldName]: `${fieldName} is required`}])
