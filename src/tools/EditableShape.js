import { ToolLike } from './Tool';

const IMPLEMENTATION_MISSING = "An implementation is missing";

export default class EditableShape extends ToolLike {

  constructor(annotation, g, config, env) {
    super(g, config, env);

    this.annotation = annotation;
  }
  
  /**
   * Implementations MUST override this method!
   * 
   * Must return the 'g' element with the a9s-annotation class.
   */
  get element() {
    throw new Error(IMPLEMENTATION_MISSING);
  }

  /**
   * Implementations MUST override this method!
   * 
   * The annotation argument MUST be used to update
   * the current state of the shape. It MUST NOT
   * be stored as 'this.annotation'! 'this.annotation'
   * MUST remain the original annotation at the time
   * this EditableShape was created, because we will
   * need it again in case the user cancels editing.
   * 
   * Thinking of it in React terms, 'this.annotation'
   * has the same purpose as props.annotation, whereas
   * this method affects state.
   */
  updateState = annotation => {
    throw new Error(IMPLEMENTATION_MISSING);
  }

}
