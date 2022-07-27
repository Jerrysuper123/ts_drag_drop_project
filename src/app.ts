
enum ProjectStatus { active, finished };

//use class Project to pre project tyle
class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: ProjectStatus
    ) { }
}

//create generic type of array parameter, becos we donot know the type in the beginning
type Listener<T> = (items: T[]) => void;

//state class is a generic type with T, T in the class can be customized when extended below
class State<T>{
    protected listeners: Listener<T>[] = [];
    constructor() { }
    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}

class ProjectState extends State<Project>{
    private projects: Project[] = [];
    private static instance: ProjectState;
    private constructor() {
        super();
    }
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }
    addProject(title: string, description: string, numOfPeople: number) {
        const newProject = new Project(
            Math.random().toString(),
            title,
            description,
            numOfPeople,
            ProjectStatus.active
        )
        this.projects.push(newProject);
        //loop thru f listener to execute on our projects []
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice())
        }
    }
}

const projectState = ProjectState.getInstance();



interface Validatable {
    value: string | number;
    //? makes it optional, possibly undefined
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(validateInput: Validatable) {
    let isValid = true;
    if (validateInput.required) {
        //toString to convert string/number to string to avoid ts error
        isValid = isValid && validateInput.value.toString().trim().length !== 0;
        // console.log("required")
    }
    //length checking is only for string && minLength is not null or undefined (avoid 0 input from user)
    if (validateInput.minLength != null && typeof validateInput.value === "string") {
        isValid = isValid && validateInput.value.length >= validateInput.minLength;
        // console.log("min l")
    }
    if (validateInput.maxLength != null && typeof validateInput.value === "string") {
        isValid = isValid && validateInput.value.length <= validateInput.maxLength;
        // console.log("max l")
    }
    if (validateInput.min != null && typeof validateInput.value === "number") {
        isValid = isValid && validateInput.value >= validateInput.min;
        // console.log("min")
    }
    if (validateInput.max != null && typeof validateInput.value === "number") {
        isValid = isValid && validateInput.value <= validateInput.max;
        // console.log("max")
    }

    return isValid;
}

// Code goes here!
function AutoBind(_: any, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: false,
        get() {
            //this here refers to the object calling get()
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    }
    //will override old descriptor
    return adjDescriptor;
}

abstract class Component<T extends HTMLElement, U extends HTMLElement>{
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(
        templateId: string,
        hostElementId: string,
        insertAtStart: boolean,
        newElementId?: string,
    ) {
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId)! as T;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as U;
        if (newElementId) {
            this.element.id = newElementId;
        }
        this.attach(insertAtStart);
    }

    private attach(insertAtStart: boolean) {
        this.hostElement.insertAdjacentElement(insertAtStart ? "afterbegin" : "beforeend", this.element)
    }
    //you cannot have private abstract method
    abstract configure(): void;
    abstract renderContent(): void;
}

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement>{
    private project: Project;

    constructor(hostId: string, project: Project) {
        super("single-project", hostId, false, project.id);
        this.project = project;
        this.configure();
        this.renderContent();
    }
    configure() {

    }
    renderContent() {
        this.element.querySelector("h2")!.textContent = this.project.title;
        this.element.querySelector("h3")!.textContent = this.project.people.toString();
        this.element.querySelector("p")!.textContent = this.project.description;
    }
}

//project list class
class ProjectList extends Component<HTMLTemplateElement, HTMLDivElement> {

    assignedProjects: Project[];

    constructor(private type: "active" | "finished") {
        super("project-list", "app", false, `${type}-projects`);

        this.assignedProjects = [];
        this.configure();
        this.renderContent();
    }

    configure() {
        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter(proj => {
                if (this.type = "active") {
                    //if 0===0
                    return proj.status === ProjectStatus.active;
                }
                return proj.status === ProjectStatus.finished;
            });
            this.assignedProjects = relevantProjects;
            this.renderProjects();
        })
    }

    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector("ul")!.id = listId;
        //insert the header
        this.element.querySelector("h2")!.textContent = this.type.toUpperCase() + " PROJECTS";
    }

    //find UI element and render projects inside i
    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        //clear UI inner content cos we repeatedly append child
        listEl.innerHTML = "";
        for (const projItem of this.assignedProjects) {
            //instan the list
            new ProjectItem(this.element.id, projItem);
        }
    }
}


class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;


    constructor() {
        super("project-input", "app", true, "user-input");
        this.titleInputElement = this.element.querySelector("#title") as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector("#description") as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector("#people") as HTMLInputElement;

        this.configure()
    }


    configure() {
        //bind(this) to point at class/instance
        this.element.addEventListener("submit", this.submitHandler)
    }

    renderContent(): void {

    }

    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;

        const titleValidatable: Validatable = { value: enteredTitle, required: true };
        const descriptionValidatable: Validatable = { value: enteredDescription, required: true, minLength: 5 };
        const peopleValidatable: Validatable = { value: +enteredPeople, required: true, min: 1, max: 5 }

        if (
            // enteredTitle.trim().length === 0 || 
            // enteredDescription.trim().length === 0 || 
            // enteredPeople.trim().length === 0
            !validate(titleValidatable) ||
            !validate(descriptionValidatable) ||
            !validate(peopleValidatable)) {
            alert("Invalid input");
            return;
        } else {
            return [enteredTitle, enteredDescription, +enteredPeople];
        }
    }

    private clearInputs() {
        this.titleInputElement.value = "";
        this.descriptionInputElement.value = "";
        this.peopleInputElement.value = "";
    }

    @AutoBind
    private submitHandler(e: Event) {
        e.preventDefault();
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput;
            //add to global singleton projectstate
            projectState.addProject(title, desc, people)
            this.clearInputs();
        }
    }
}

//when user load js script, it creates an instance, then on this instance/object, users can interact with browser
//this instance will keep track of everything that user did
const projInput = new ProjectInput();
const activeProjList = new ProjectList("active");
const finishedProjList = new ProjectList("finished");