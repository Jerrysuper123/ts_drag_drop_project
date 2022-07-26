// Code goes here!

class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;

    constructor() {
        this.templateElement = document.getElementById("project-input")! as HTMLTemplateElement;
        this.hostElement = document.getElementById("app")! as HTMLDivElement;
        //import the template node
        const importedNode = document.importNode(this.templateElement.content, true);
        //strip off the template open and closing brackets
        this.element = importedNode.firstElementChild as HTMLFormElement;
        //call this attach when instantiated immediately
        this.attach()
    }

    private attach() {
        //insert the form into the <div "app"> afterbegin
        this.hostElement.insertAdjacentElement("afterbegin", this.element)
    }
}

const projInput = new ProjectInput();