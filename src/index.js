/** Error Handling with Folktale
 * Folktale provides algebraic data types in the style of statically typed,
 * functional programming languages for use in JavaScript. The three types of
 * use for error handling are, in order of sophistication, `Maybe`, `Result`,
 * and `Validation`. This document describes some of the functionality of these
 * data types, including several functions that are undocumented by part of the
 * library and potentially useful.
 */

// `Maybe` - Models the presence or absence of a value.

const Maybe = require('folktale/maybe')

/** Maybe is a sum type with two values, `Just` and `Nothing`. `Just` represents
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

// `Result` - Models the result of operations that may fail.



// `Validation` - models the result of operations that may fail and aggregates the failures.

const Validation = require('folktale/validation')

/**
 * Validation is a sum type with two values, `Success` and `Failure`. When
 * validating values using this datatype, the result is wrapped in either one or
 * the other, depending on the result (i.e. success or failure) of the
 * corresponding validation function. When composed together, the final value of
 * these functions will either be `Success` wrapping the last successfully validated
 * value or `Failure` wrapping an aggregation of those values.
 */

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

/** Validation rules
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

/** Field validations
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

/** Form validations
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

/** Validation handling
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
 * Reducing values.
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
 * Transforming values.
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

/** Combining Maybe with Validation
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

const nullCheck = value => value === null
  ? Nothing()
  : Just(value)

const undefinedCheck = value => value === undefined
  ? Nothing()
  : Just(value)

const emptyStringCheck = value => value === ''
  ? Nothing()
  : Just(value)

const exceptionCheck = value => nullCheck(value)
  .chain(undefinedCheck)
  .chain(emptyStringCheck)

const isRequiredMatch = (field, fieldName) => Validation.fromMaybe(exceptionCheck(field)).matchWith({
  Success: ({ value }) => Success(value),
  Failure: _           => Failure([{[fieldName]: `${fieldName} is required`}])
})

// This is the same function as above but with less redundancy.
const isRequiredMap = (field, fieldName) => Validation.fromMaybe(exceptionCheck(field))
  .mapFailure(_ => [{[fieldName]: `${fieldName} is required`}])
