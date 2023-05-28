import * as React from 'react'
import { Form, Button, Select } from 'semantic-ui-react'
import Auth from '../auth/Auth'
import { getUploadUrl, uploadFile, patchTodo, getTodos } from '../api/todos-api'
import { apiEndpoint } from '../config'

enum UploadState {
   NoUpload,
   FetchingPresignedUrl,
   UploadingFile,
}

interface EditTodoProps {
   match: {
      params: {
         todoId: string
      }
   }
   auth: Auth
}

interface EditTodoState {
   file: any
   uploadState: UploadState
   selectedOption: string;
   status: any
}


export class UpdateTodo extends React.PureComponent<
   EditTodoProps,
   EditTodoState
> {
   state: EditTodoState = {
      file: undefined,
      uploadState: UploadState.NoUpload,
      selectedOption: 'in-proccess',
      status: ""

   }

   auth: any
   todoId: any
   todo: any

   async componentDidMount() {
      const { auth, match } = this.props;
      const todoId = match.params.todoId;
      console.log(match)
      this.auth = auth
      this.todoId = todoId

      try {
         const todos = await getTodos(auth.getIdToken())
         const foundTodo = todos.find(todo => todo.todoId === todoId);
         if (foundTodo != null) {
            this.state.status = foundTodo.status

         }
         this.todo = foundTodo
      } catch (e) {
         alert(`Failed to fetch todos: ${(e as Error).message}`)
      }



   }

   handleSubmit2 = async() => {

      console.log( this.state.selectedOption)
      try {
         const res = await patchTodo(this.props.auth.getIdToken(), this.todoId, {
            name: this.todo.name,
            dueDate: this.todo.dueDate,
            status: this.state.selectedOption,
            done: this.todo.done
         })

         console.log(res)

      } catch {
         alert('Todo deletion failed')
      }
   }


   handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files) return

      this.setState({
         file: files[0]
      })
   }

   handleOptionChange = (event: any) => {
      console.log(event.target.outerText)
      this.setState({
        selectedOption: event.target.outerText,
      });

      console.log(event)
    };
  



   handleSubmit = async (event: React.SyntheticEvent) => {
      event.preventDefault()



      try {
         if (!this.state.file) {
            alert('File should be selected')
            return
         }

         this.setUploadState(UploadState.FetchingPresignedUrl)
         const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), this.props.match.params.todoId)

         this.setUploadState(UploadState.UploadingFile)
         await uploadFile(uploadUrl, this.state.file)

         alert('File was uploaded!')
      } catch (e) {
         alert('Could not upload a file: ' + (e as Error).message)
      } finally {
         this.setUploadState(UploadState.NoUpload)
      }
   }

   setUploadState(uploadState: UploadState) {
      this.setState({
         uploadState
      })
   }

   render() {
      return (
         <div>
            <h1>Upload new image</h1>

            <Form onSubmit={this.handleSubmit}>
               <Form.Field>
                  <label>Upload File</label>
                  <input
                     type="file"
                     accept="image/*"
                     placeholder="Image to upload"
                     onChange={this.handleFileChange}
                  />
               </Form.Field>

               {this.renderButton()}
               
            
  
            </Form>
            <Form>
            <h1>Change status</h1>
               <Form.Field>
                  <label>Select an option</label>
                  <Select
                     placeholder="Select an option"
                     options={[
                        { key: 'in-proccess', value: 'in-proccess', text: 'in-proccess' },
                        { key: 'delay', value: 'delay', text: 'delay' },
                        { key: 'done', value: 'done', text: 'done' },
                     ]}
                     value={this.state.selectedOption}
                     onChange={(event)=>this.handleOptionChange(event)}
                  />
               </Form.Field>
               <Button onClick={()=>this.handleSubmit2()}>Submit</Button>

               </Form>
         </div>
      )
   }

   renderButton() {

      return (
         <div>
            {this.state.uploadState === UploadState.FetchingPresignedUrl && <p>Uploading image metadata</p>}
            {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
            <Button
               loading={this.state.uploadState !== UploadState.NoUpload}
               type="submit"
            >
               Upload
            </Button>
         </div>
      )
   }
}
