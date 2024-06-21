const realName: string = 'Kim Do Yun'

interface Person {
    name: string;
    age: number;
    school: 'Korea Digital Media High School';
    grade: number;
    class: number;
    number: number;
    remark: object | null;
}

class Human {
    private _person: Person

    constructor (person: Person) {
        this._person = person
    }

    personToString () {
        return `${ this._person.name }은 ${ this._person.school }에 재학 중인 ${ this._person.grade }학년 입니다.`
    }
}

const human = new Human({ name: realName, age: 17, school: 'Korea Digital Media High School', grade: 2, class: 4, number: 4, remark: null })
human.personToString()

// https://any-ting.tistory.com/14