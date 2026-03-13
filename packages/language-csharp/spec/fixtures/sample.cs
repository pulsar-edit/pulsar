namespace MyApp;
// ^^^^^^ storage.type.namespace.cs
//        ^^^^^ entity.name.type.module.cs

class Vehicle {
  //  ^^^^^^^ entity.name.type.class.cs
  public string brand = "Ford";
// ^^^^^ storage.modifier.public.cs
//       ^^^^^^ support.storage.type.builtin.cs
//                    ^ keyword.operator.assignment.cs
//                      ^^^^^^ string.quoted.double.cs
  public void honk() {
    //        ^^^^ entity.name.function.method.cs
    Console.WriteLine("Honk!");
    //     ^ keyword.operator.accessor.cs
  }
}

class Car : Vehicle {
  //        ^^^^^^^ support.storage.type.cs
  public string modelName = "Mustang";
}

class Program {
  static void Main(string[] args) {
    //             ^^^^^^ support.storage.type.builtin.cs
    //                      ^^^^ variable.parameter.cs
    //                   ^^ punctuation.definition
    Car myCar = new Car();
//  ^^^ support.storage.type.cs
//      ^^^^^ variable.other.assignment.cs

    myCar.honk();

    Console.WriteLine(myCar.brand + " " + myCar.modelName);
  }
}
