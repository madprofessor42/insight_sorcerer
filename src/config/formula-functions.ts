/**
 * Formula functions available in the equation editor
 * Based on the simulation package functions
 */

export interface FormulaFunction {
  name: string;
  description: string;
  signature: string;
  displaySignature?: string; // Optional: for displaying shortened version in UI
  example?: string;
}

export interface FunctionCategory {
  name: string;
  icon?: string;
  functions: FormulaFunction[];
}

export const FORMULA_FUNCTIONS: FunctionCategory[] = [
  {
    name: 'Mathematical Functions',
    functions: [
      { name: 'Round', description: 'Rounds a number to the nearest integer', signature: 'Round(Value)', example: 'Round(3.6) → 4' },
      { name: 'Ceiling', description: 'Rounds a number up to the nearest integer', signature: 'Ceiling(Value)', example: 'Ceiling(3.01) → 4' },
      { name: 'Floor', description: 'Rounds a number down to the nearest integer', signature: 'Floor(Value)', example: 'Floor(3.99) → 3' },
      { name: 'Abs', description: 'Returns the absolute value of a number', signature: 'Abs(Value)', example: 'Abs(-5) → 5' },
      { name: 'Sqrt', description: 'Returns the square root of a number', signature: 'Sqrt(Value)', example: 'Sqrt(25) → 5' },
      { name: 'Exp', description: 'Returns e raised to the power of a number', signature: 'Exp(Value)', example: 'Exp(1) → 2.718' },
      { name: 'Ln', description: 'Returns the natural logarithm of a number', signature: 'Ln(Value)', example: 'Ln(2.718) → 1' },
      { name: 'Log', description: 'Returns the base-10 logarithm of a number', signature: 'Log(Value)', example: 'Log(100) → 2' },
      { name: 'Sin', description: 'Returns the sine of an angle', signature: 'Sin(Angle)', example: 'Sin(pi/2) → 1' },
      { name: 'Cos', description: 'Returns the cosine of an angle', signature: 'Cos(Angle)', example: 'Cos(0) → 1' },
      { name: 'Tan', description: 'Returns the tangent of an angle', signature: 'Tan(Angle)', example: 'Tan(pi/4) → 1' },
      { name: 'ArcSin', description: 'Returns the arc-sine of a value', signature: 'ArcSin(Value)', example: 'ArcSin(1) → pi/2' },
      { name: 'ArcCos', description: 'Returns the arc-cosine of a value', signature: 'ArcCos(Value)', example: 'ArcCos(1) → 0' },
      { name: 'ArcTan', description: 'Returns the arc-tangent of a value', signature: 'ArcTan(Value)', example: 'ArcTan(1) → pi/4' },
      { name: 'Sign', description: 'Returns the sign of a number (-1, 0, or 1)', signature: 'Sign(Value)', example: 'Sign(-5) → -1' },
      { name: 'mod', description: 'Returns the remainder of division', signature: '(Value One) mod (Value Two)', example: '13 mod 5 → 3' },
      { name: 'Logit', description: 'Returns the logit of a probability', signature: 'Logit(Value)', example: 'Logit(0.5) → 0' },
      { name: 'Expit', description: 'Returns the inverse logit', signature: 'Expit(Value)', example: 'Expit(0) → 0.5' },
      { name: 'pi', description: 'The constant π (3.14159265)', signature: 'pi', example: 'pi → 3.14159265' },
      { name: 'e', description: 'The constant e (2.71828183)', signature: 'e', example: 'e → 2.71828183' },
    ],
  },
  {
    name: 'Time Functions',
    functions: [
      { name: 'Time', description: 'Current simulation time with units', signature: 'Time()', example: 'Time() → {5 Years}' },
      { name: 'TimeStep', description: 'Simulation time step with units', signature: 'TimeStep()', example: 'TimeStep() → {0.25 Years}' },
      { name: 'TimeStart', description: 'Simulation start time with units', signature: 'TimeStart()', example: 'TimeStart() → {0 Years}' },
      { name: 'TimeEnd', description: 'Simulation end time with units', signature: 'TimeEnd()', example: 'TimeEnd() → {100 Years}' },
      { name: 'TimeLength', description: 'Total simulation length with units', signature: 'TimeLength()', example: 'TimeLength() → {100 Years}' },
      { name: 'Seconds', description: 'Current time in seconds', signature: 'Seconds()', example: 'Seconds() → 86400' },
      { name: 'Minutes', description: 'Current time in minutes', signature: 'Minutes()', example: 'Minutes() → 1440' },
      { name: 'Hours', description: 'Current time in hours', signature: 'Hours()', example: 'Hours() → 24' },
      { name: 'Days', description: 'Current time in days', signature: 'Days()', example: 'Days() → 1' },
      { name: 'Weeks', description: 'Current time in weeks', signature: 'Weeks()', example: 'Weeks() → 4' },
      { name: 'Months', description: 'Current time in months', signature: 'Months()', example: 'Months() → 12' },
      { name: 'Years', description: 'Current time in years', signature: 'Years()', example: 'Years() → 1' },
      { name: 'Pulse', description: 'Creates a pulse function', signature: 'Pulse(Time, Height, Width=0, Repeat=-1)', example: 'Pulse({10 Years}, 5, 2)' },
      { name: 'Step', description: 'Creates a step function', signature: 'Step(Start, Height=1)', example: 'Step({10 Years}, 5)' },
      { name: 'Ramp', description: 'Creates a ramp function', signature: 'Ramp(Start, Finish, Height=1)', example: 'Ramp({10 Years}, {20 Years}, 5)' },
      { name: 'Seasonal', description: 'Creates a seasonal sine wave', signature: 'Seasonal(Peak=0)', example: 'Seasonal({6 Months})' },
    ],
  },
  {
    name: 'Historical Functions',
    functions: [
      { name: 'Delay', description: 'Returns a delayed value of a primitive', signature: 'Delay([Primitive], Delay Length, Default Value)', example: 'Delay([Stock], {5 Years}, 100)' },
      { name: 'Smooth', description: 'Smooths a value over time', signature: 'Smooth([Value], Length, Initial Value?)', example: 'Smooth([Flow], {12 Months})' },
      { name: 'Delay1', description: 'First-order delay', signature: 'Delay1([Value], Delay Length, Initial Value?)', example: 'Delay1([Flow], {1 year}, 200)' },
      { name: 'Delay3', description: 'Third-order delay', signature: 'Delay3([Value], Delay Length, Initial Value?)', example: 'Delay3([Flow], {5 Years}, 100000)' },
      { name: 'DelayN', description: 'N-th order delay', signature: 'DelayN([Value], Delay Length, Order, Initial Value?)', example: 'DelayN([Flow], {5 Years}, 3, 100)' },
      { name: 'SmoothN', description: 'N-th order smoothing', signature: 'SmoothN([Value], Length, Order, Initial Value?)', example: 'SmoothN([Flow], {1 Year}, 3, 100000)' },
      { name: 'PastValues', description: 'Returns past values of a primitive', signature: 'PastValues([Primitive], Period?)', example: 'PastValues([Stock], {5 Years})' },
      { name: 'PastMean', description: 'Returns mean of past values', signature: 'PastMean([Primitive], Period?)', example: 'PastMean([Stock], {10 Years})' },
      { name: 'PastMedian', description: 'Returns median of past values', signature: 'PastMedian([Primitive], Period?)', example: 'PastMedian([Stock], {1 Year})' },
      { name: 'PastStdDev', description: 'Returns standard deviation of past values', signature: 'PastStdDev([Primitive], Period?)', example: 'PastStdDev([Stock], {1 Year})' },
      { name: 'PastMax', description: 'Returns maximum of past values', signature: 'PastMax([Primitive], Period?)', example: 'PastMax([Stock], {10 Years})' },
      { name: 'PastMin', description: 'Returns minimum of past values', signature: 'PastMin([Primitive], Period?)', example: 'PastMin([Stock], {2 Years})' },
      { name: 'PastCorrelation', description: 'Returns correlation between primitives', signature: 'PastCorrelation([Primitive], [Primitive], Period?)', example: 'PastCorrelation([Income], [Expenditures], {10 Years})' },
      { name: 'Fix', description: 'Aggregates a value over time', signature: 'Fix(Value, Period?)', example: 'Fix(Rand(), {5 Years})' },
    ],
  },
  {
    name: 'Random Number Functions',
    functions: [
      { name: 'Rand', description: 'Returns a random number', signature: 'Rand(Min?, Max?)', example: 'Rand(0, 1) → 0.547' },
      { name: 'RandNormal', description: 'Returns a normally distributed random number', signature: 'RandNormal(Mean?, StdDev?)', example: 'RandNormal(0, 1) → -0.234' },
      { name: 'RandExp', description: 'Returns an exponentially distributed random number', signature: 'RandExp(Rate?)', example: 'RandExp(1) → 0.847' },
      { name: 'RandLognormal', description: 'Returns a lognormally distributed random number', signature: 'RandLognormal(Mean, StdDev)', example: 'RandLognormal(0, 1) → 1.234' },
      { name: 'RandBinomial', description: 'Returns a binomially distributed random number', signature: 'RandBinomial(Count, Probability)', example: 'RandBinomial(10, 0.5) → 6' },
      { name: 'RandNegativeBinomial', description: 'Returns a negative binomially distributed random number', signature: 'RandNegativeBinomial(Successes, Probability)', example: 'RandNegativeBinomial(5, 0.5) → 3' },
      { name: 'RandPoisson', description: 'Returns a Poisson distributed random number', signature: 'RandPoisson(Rate)', example: 'RandPoisson(5) → 4' },
      { name: 'RandGamma', description: 'Returns a gamma distributed random number', signature: 'RandGamma(Alpha, Beta)', example: 'RandGamma(2, 2) → 3.5' },
      { name: 'RandTriangular', description: 'Returns a triangularly distributed random number', signature: 'RandTriangular(Min, Max, Peak)', example: 'RandTriangular(0, 10, 7) → 6.8' },
      { name: 'RandBeta', description: 'Returns a beta distributed random number', signature: 'RandBeta(Alpha, Beta)', example: 'RandBeta(2, 5) → 0.3' },
      { name: 'RandBoolean', description: 'Returns a random boolean', signature: 'RandBoolean(Probability?)', example: 'RandBoolean(0.7) → true' },
      { name: 'RandDist', description: 'Returns a random number from a custom distribution', signature: 'RandDist(X, Y)', example: 'RandDist({1, 2, 3}, {0.2, 0.5, 0.3})' },
      { name: 'SetRandSeed', description: 'Sets the random number seed', signature: 'SetRandSeed(Seed)', example: 'SetRandSeed(12345)' },
    ],
  },
  {
    name: 'Agent Functions',
    functions: [
      { name: '[Population].Add', description: 'Adds an agent to a population', signature: '[Population].Add(Base Agent?)', example: '[University].Add()' },
      { name: '[Agent].Remove', description: 'Removes an agent from a population', signature: '[Agent].Remove()', example: 'agent.Remove()' },
      { name: '[Population].PopulationSize', description: 'Returns the size of a population', signature: '[Population].PopulationSize()', example: '[Fish].PopulationSize()' },
      { name: '[Population].FindAll', description: 'Finds all agents in a population', signature: '[Population].FindAll()', example: '[Fish].FindAll()' },
      { name: '[Population].FindIndex', description: 'Finds agent by index', signature: '[Population].FindIndex(Index)', example: '[Fish].FindIndex(1)' },
      { name: '[Population].FindState', description: 'Finds agents in a specific state', signature: '[Population].FindState([State])', example: '[Students].FindState([Studying])' },
      { name: '[Population].FindNotState', description: 'Finds agents not in a specific state', signature: '[Population].FindNotState([State])', example: '[Patients].FindNotState([Recovered])' },
      { name: '[Population].FindNearest', description: 'Finds nearest agent(s)', signature: '[Population].FindNearest(Target, Count=1)', example: '[Customers].FindNearest(Store)' },
      { name: '[Population].FindFurthest', description: 'Finds furthest agent(s)', signature: '[Population].FindFurthest(Target, Count=1)', example: '[Population].FindFurthest(Target, 4)' },
      { name: '[Population].FindNearby', description: 'Finds agents within distance', signature: '[Population].FindNearby(Target, Distance)', example: '[Trees].FindNearby(PollutedArea, 50)' },
      { name: '[Population].Value', description: 'Gets value of a primitive in agents', signature: '[Population].Value([Primitive])', example: '[University].Value([GPA])' },
      { name: '[Population].SetValue', description: 'Sets value of a primitive in agents', signature: '[Population].SetValue([Primitive], Value)', example: '[University].SetValue([Smoker], false)' },
      { name: '[Agent].Index', description: 'Returns the index of an agent', signature: '[Agent].Index()', example: 'Self.Index()' },
      { name: '[Agent].Location', description: 'Returns the location of an agent', signature: '[Agent].Location()', example: 'Self.Location().x' },
      { name: '[Agent].SetLocation', description: 'Sets the location of an agent', signature: '[Agent].SetLocation(New Location)', example: 'Student.SetLocation({x: 60, y: 40})' },
      { name: '[Agent].Move', description: 'Moves an agent by a direction vector', signature: '[Agent].Move({x, y})', example: 'Self.Move({x: 0, y: -5})' },
      { name: '[Agent].MoveTowards', description: 'Moves agent towards a target', signature: '[Agent].MoveTowards(Target, Distance)', example: 'Self.MoveTowards({0, 100}, 10)' },
      { name: 'Distance', description: 'Returns distance between two locations', signature: 'Distance(Location One, Location Two)', example: 'Distance({x: 10, y: 5}, {x: 20, y: 15})' },
      { name: 'Width', description: 'Returns width of agent space', signature: 'Width(Agent)', example: 'Width(Self)' },
      { name: 'Height', description: 'Returns height of agent space', signature: 'Height(Agent)', example: 'Height(Self)' },
      { name: '[Agent].Connect', description: 'Creates a connection between agents', signature: '[Agent 1].Connect([Agent 2], Weight=1)', example: 'Self.Connect([Population].FindNearest(Self), 5)' },
      { name: '[Agent].Unconnect', description: 'Removes a connection between agents', signature: '[Agent 1].Unconnect([Agent 2])', example: 'Self.Unconnect(SpecificAgent)' },
      { name: '[Agent].Connected', description: 'Returns connected agents', signature: '[Agent].Connected()', example: 'Self.Connected()' },
      { name: '[Agent].ConnectionWeight', description: 'Returns connection weight', signature: '[Agent 1].ConnectionWeight([Agent 2])', example: 'Self.ConnectionWeight(agent)' },
      { name: '[Agent].SetConnectionWeight', description: 'Sets connection weight', signature: '[Agent 1].SetConnectionWeight([Agent 2], Weight)', example: 'Self.SetConnectionWeight(Other, 10)' },
      { name: 'Transition', description: 'Triggers a state transition', signature: 'Transition([Transition])', example: 'Transition([ToInfected])' },
      { name: 'ResetTimer', description: 'Resets an action timer', signature: 'ResetTimer([Action])', example: 'ResetTimer([MyAction])' },
    ],
  },
  {
    name: 'Vector Functions',
    functions: [
      { name: 'Range', description: 'Creates a vector with sequential values', signature: 'Start:End or Start:Step:End', example: '1:5 or 0:2:10' },
      { name: 'Sum', description: 'Returns the sum of vector elements', signature: 'Sum(Values)', example: 'Sum({1,2,3}) → 6' },
      { name: 'Mean', description: 'Returns the mean of vector elements', signature: 'Mean(Values)', example: 'Mean({1,2,3}) → 2' },
      { name: 'Median', description: 'Returns the median of vector elements', signature: 'Median(Values)', example: 'Median({1,2,3}) → 2' },
      { name: 'StdDev', description: 'Returns the standard deviation', signature: 'StdDev(Values)', example: 'StdDev({1,2,3}) → 1' },
      { name: 'Min', description: 'Returns the minimum value', signature: 'Min(Values)', example: 'Min({1,2,3}) → 1' },
      { name: 'Max', description: 'Returns the maximum value', signature: 'Max(Values)', example: 'Max({1,2,3}) → 3' },
      { name: 'Product', description: 'Returns the product of elements', signature: 'Product(Values)', example: 'Product({2,3,4}) → 24' },
      { name: 'Vector.Length', description: 'Returns the number of elements', signature: 'Vector.Length()', example: '{1,2,3}.Length() → 3' },
      { name: 'Vector.Sort', description: 'Sorts vector elements', signature: 'Vector.Sort()', example: '{3,1,2}.Sort() → {1,2,3}' },
      { name: 'Vector.Reverse', description: 'Reverses vector order', signature: 'Vector.Reverse()', example: '{1,2,3}.Reverse() → {3,2,1}' },
      { name: 'Vector.Unique', description: 'Returns unique elements', signature: 'Vector.Unique()', example: '{1,2,2,3}.Unique() → {1,2,3}' },
      { name: 'Join', description: 'Joins items into a vector', signature: 'Join(Item 1, Item 2, ...)', example: 'Join({1,2}, {3,4}) → {1,2,3,4}' },
      { name: 'Vector.Join', description: 'Joins vector elements into string', signature: 'Vector.Join(Separator)', example: '{"a","b"}.Join(",") → "a,b"' },
      { name: 'Vector{Selector}', description: 'Selects elements from vector', signature: 'Vector{Selector}', example: '{1,3,7}{2} → 3' },
      { name: 'Vector.IndexOf', description: 'Finds index of element', signature: 'Vector.IndexOf(Needle)', example: '{"a","b","c"}.IndexOf("b") → 2' },
      { name: 'Vector.Contains', description: 'Checks if vector contains element', signature: 'Vector.Contains(Needle)', example: '{"a","b"}.Contains("a") → true' },
      { name: 'Vector.Sample', description: 'Random sample from vector', signature: 'Vector.Sample(Sample Size, Allow Repeats=False)', example: '{1,2,3}.Sample(2)' },
      { name: 'Vector.Map', description: 'Applies function to each element', signature: 'Vector.Map(Function)', example: '{1,2,3}.Map(x^2) → {1,4,9}' },
      { name: 'Vector.Filter', description: 'Filters vector elements', signature: 'Vector.Filter(Function)', example: '{1,2,3}.Filter(x>1) → {2,3}' },
      { name: 'Vector.Flatten', description: 'Flattens nested vectors', signature: 'Vector.Flatten()', example: '{{1,2},{3,4}}.Flatten() → {1,2,3,4}' },
      { name: 'Repeat', description: 'Repeats expression N times', signature: 'Repeat(Expression, Times)', example: 'Repeat(x^2, 3) → {1,4,9}' },
      { name: 'Vector.Keys', description: 'Returns vector keys', signature: 'Vector.Keys()', example: '{x:1, y:2}.Keys() → {"x","y"}' },
      { name: 'Vector.Values', description: 'Returns vector values', signature: 'Vector.Values()', example: '{x:1, y:2}.Values() → {1,2}' },
      { name: 'Vector.Union', description: 'Returns union of vectors', signature: 'Vector.Union(Vector 2)', example: '{1,2}.Union({2,3}) → {1,2,3}' },
      { name: 'Vector.Intersection', description: 'Returns intersection of vectors', signature: 'Vector.Intersection(Second Vector)', example: '{1,2}.Intersection({2,3}) → {2}' },
      { name: 'Vector.Difference', description: 'Returns difference of vectors', signature: 'Vector.Difference(Vector 2)', example: '{1,2}.Difference({2,3}) → {1}' },
      { name: 'Lookup', description: 'Looks up value in table', signature: 'Lookup(Value, Values Vector, Results Vector)', example: 'Lookup(5, {0,10}, {0,100}) → 50' },
    ],
  },
  {
    name: 'General Functions',
    functions: [
      { name: 'Stop', description: 'Stops the simulation', signature: 'Stop()', example: 'Stop()' },
      { name: 'Pause', description: 'Pauses the simulation', signature: 'Pause()', example: 'Pause()' },
      { name: 'ConverterTable', description: 'Returns converter table', signature: 'ConverterTable([Converter])', example: 'ConverterTable([MyConverter])' },
    ],
  },
  {
    name: 'String Functions',
    functions: [
      { name: 'String.Parse', description: 'Converts string to number', signature: 'String.Parse()', example: '"123".Parse() → 123' },
      { name: 'String.Split', description: 'Splits string by delimiter', signature: 'String.Split(Delimiter)', example: '"a,b,c".Split(",") → {"a","b","c"}' },
      { name: 'String.Trim', description: 'Removes whitespace from both ends', signature: 'String.Trim()', example: '"  hello  ".Trim() → "hello"' },
      { name: 'String.Range', description: 'Extracts characters by index', signature: 'String.Range(Characters)', example: '"abcdef".Range(2:4) → "bcd"' },
      { name: 'String.Length', description: 'Returns string length', signature: 'String.Length()', example: '"Hello".Length() → 5' },
      { name: 'String.IndexOf', description: 'Finds index of substring', signature: 'String.IndexOf(Needle)', example: '"hello".IndexOf("ll") → 3' },
      { name: 'String.Contains', description: 'Checks if string contains substring', signature: 'String.Contains(Needle)', example: '"hello".Contains("ll") → true' },
      { name: 'String.LowerCase', description: 'Converts string to lowercase', signature: 'String.LowerCase()', example: '"Hello".LowerCase() → "hello"' },
      { name: 'String.UpperCase', description: 'Converts string to uppercase', signature: 'String.UpperCase()', example: '"HELLO".UpperCase() → "HELLO"' },
    ],
  },
  {
    name: 'Programming',
    functions: [
      { 
        name: 'Variable', 
        description: 'Assigns a value to a variable', 
        signature: 'Variable <- Value', 
        example: 'x <- 10' 
      },
      { 
        name: 'Multiple Assignment', 
        description: 'Assigns multiple values using destructuring', 
        signature: 'a, b <- {Value1, Value2}', 
        example: 'x, y <- {10, 20}' 
      },
      { 
        name: 'IfThenElse', 
        description: 'Single-line conditional expression', 
        signature: 'IfThenElse(Test Condition, Value if True, Value if False)', 
        example: 'IfThenElse(x>5, 1, 0)' 
      },
      { 
        name: 'If Statement', 
        description: 'Multi-line conditional block', 
        signature: 'if Condition then\n  Expression\nelse if Condition then\n  Expression\nelse\n  Expression\nend if',
        displaySignature: 'if...then...else if...else...end if',
        example: 'if x > 5 then\n  "High"\nelse\n  "Low"\nend if' 
      },
      { 
        name: 'While Loop', 
        description: 'Repeats while condition is true', 
        signature: 'while Condition\n  Expression\nend loop',
        displaySignature: 'while...end loop',
        example: 'while x < 10\n  x <- x + 1\nend loop' 
      },
      { 
        name: 'For Loop', 
        description: 'Iterates from start to end', 
        signature: 'for Variable from Start to End [by Step]\n  Expression\nend loop',
        displaySignature: 'for...from...to...end loop',
        example: 'for i from 1 to 10\n  total <- total + i\nend loop' 
      },
      { 
        name: 'For In Loop', 
        description: 'Iterates over vector elements', 
        signature: 'for Element in Vector\n  Expression\nend loop',
        displaySignature: 'for...in...end loop',
        example: 'for x in {1, 2, 3}\n  sum <- sum + x\nend loop' 
      },
      { 
        name: 'Function', 
        description: 'Defines a named function', 
        signature: 'Function Name()\n  Expression\nEnd Function',
        displaySignature: 'Function...End Function',
        example: 'Function Double(x)\n  x * 2\nEnd Function' 
      },
      { 
        name: 'Anonymous Function', 
        description: 'Multi-line anonymous function', 
        signature: 'Variable <- Function()\n  Expression\nEnd Function',
        displaySignature: 'Variable <- Function()...End Function',
        example: 'Double <- Function(x)\n  x * 2\nEnd Function' 
      },
      { 
        name: 'Anonymous Function (inline)', 
        description: 'Single-line anonymous function', 
        signature: 'Function() Expression',
        example: 'Function(x) x * 2' 
      },
      { 
        name: 'Throw Error', 
        description: 'Throws an error with a message', 
        signature: 'throw \'Message\'',
        example: 'throw \'Invalid value\'' 
      },
      { 
        name: 'Try Catch', 
        description: 'Error handling block', 
        signature: 'Try\n  Expression\nCatch ErrorString\n  Expression\nEnd Try',
        displaySignature: 'Try...Catch...End Try',
        example: 'Try\n  x / y\nCatch err\n  0\nEnd Try' 
      },
      { 
        name: 'Comment', 
        description: 'Single-line comment', 
        signature: '# Comment', 
        example: '# This is a comment' 
      },
      { 
        name: 'Multi-line Comment', 
        description: 'Multi-line comment block', 
        signature: '/* Comment\n   Multiple lines\n*/',
        displaySignature: '/* ... */',
        example: '/* This spans\n   multiple lines */' 
      },
    ],
  },
  {
    name: 'User Input Functions',
    functions: [
      { name: 'Alert', description: 'Shows an alert dialog', signature: 'Alert(Message)', example: 'Alert("Warning!")' },
      { name: 'Prompt', description: 'Shows a prompt dialog', signature: 'Prompt(Message, Default?)', example: 'Prompt("Enter name:", "John")' },
      { name: 'Confirm', description: 'Shows a confirmation dialog', signature: 'Confirm(Message)', example: 'Confirm("Are you sure?")' },
    ],
  },
  {
    name: 'Statistical Distributions',
    functions: [
      { name: 'CDFNormal', description: 'Normal distribution CDF', signature: 'CDFNormal(x, Mean=0, Standard Deviation=1)', example: 'CDFNormal(0) → 0.5' },
      { name: 'PDFNormal', description: 'Normal distribution PDF', signature: 'PDFNormal(x, Mean=0, Standard Deviation=1)', example: 'PDFNormal(0) → 0.399' },
      { name: 'InvNormal', description: 'Inverse normal CDF', signature: 'InvNormal(p, Mean=0, Standard Deviation=1)', example: 'InvNormal(0.5) → 0' },
      { name: 'CDFLognormal', description: 'Lognormal distribution CDF', signature: 'CDFLognormal(x, Mean=0, Standard Deviation=1)', example: 'CDFLognormal(3) → 0.864' },
      { name: 'PDFLognormal', description: 'Lognormal distribution PDF', signature: 'PDFLognormal(x, Mean=0, Standard Deviation=1)', example: 'PDFLognormal(3) → 0.073' },
      { name: 'InvLognormal', description: 'Inverse lognormal CDF', signature: 'InvLognormal(p, Mean=0, Standard Deviation=1)', example: 'InvLognormal(0.5) → 1' },
      { name: 'CDFt', description: 'Student-t distribution CDF', signature: 'CDFt(x, Degrees Of Freedom)', example: 'CDFt(0, 30) → 0.5' },
      { name: 'PDFt', description: 'Student-t distribution PDF', signature: 'PDFt(x, Degrees Of Freedom)', example: 'PDFt(0, 30) → 0.396' },
      { name: 'Invt', description: 'Inverse Student-t CDF', signature: 'Invt(p, Degrees Of Freedom)', example: 'Invt(0.5, 30) → 0' },
      { name: 'CDFF', description: 'F-distribution CDF', signature: 'CDFF(x, Degrees Of Freedom1, Degrees Of Freedom2)', example: 'CDFF(3.84, 1, 5) → 0.893' },
      { name: 'PDFF', description: 'F-distribution PDF', signature: 'PDFF(x, Degrees Of Freedom1, Degrees Of Freedom2)', example: 'PDFF(1, 10, 10) → 0.615' },
      { name: 'InvF', description: 'Inverse F-distribution CDF', signature: 'InvF(p, Degrees Of Freedom1, Degrees Of Freedom2)', example: 'InvF(0.95, 5, 2) → 19.3' },
      { name: 'CDFChiSquared', description: 'Chi-squared distribution CDF', signature: 'CDFChiSquared(x, Degrees Of Freedom)', example: 'CDFChiSquared(10, 5) → 0.925' },
      { name: 'PDFChiSquared', description: 'Chi-squared distribution PDF', signature: 'PDFChiSquared(x, Degrees Of Freedom)', example: 'PDFChiSquared(2, 5) → 0.138' },
      { name: 'InvChiSquared', description: 'Inverse chi-squared CDF', signature: 'InvChiSquared(p, Degrees Of Freedom)', example: 'InvChiSquared(0.95, 3) → 7.81' },
      { name: 'CDFExponential', description: 'Exponential distribution CDF', signature: 'CDFExponential(x, Rate)', example: 'CDFExponential(1, 1)' },
      { name: 'PDFExponential', description: 'Exponential distribution PDF', signature: 'PDFExponential(x, Rate)', example: 'PDFExponential(1, 1)' },
      { name: 'InvExponential', description: 'Inverse exponential CDF', signature: 'InvExponential(p, Rate)', example: 'InvExponential(0.5, 1)' },
      { name: 'CDFPoisson', description: 'Poisson distribution CDF', signature: 'CDFPoisson(x, Lambda)', example: 'CDFPoisson(5, 5)' },
      { name: 'PMFPoisson', description: 'Poisson distribution PMF', signature: 'PMFPoisson(x, Lambda)', example: 'PMFPoisson(5, 5)' },
    ],
  },
];

