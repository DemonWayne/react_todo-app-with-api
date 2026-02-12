/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import cn from 'classnames';
import { TEMP_TODO_ID } from './constants';
import {
  USER_ID,
  addTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from './api/todos';
import { Todo, TodoChangeOptions } from './types/Todo';
import { UserWarning } from './UserWarning';
import { Filter, FilterType } from './types/FilterType';
import { TodoList } from './components/TodoList';
import { TodoFooter } from './components/TodoFooter';
import { ErrorNotification } from './components/ErrorNotification';
import { ErrorMessage, MainPhrases } from './constants';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<Partial<Todo> | null>(null);
  const [filter, setFilter] = useState<FilterType>(Filter.All);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>(
    ErrorMessage.default,
  );
  const [processingIds, setProcessingIds] = useState<number[]>([]);

  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage(ErrorMessage.errorLoadFailed));
  }, []);

  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      switch (filter) {
        case Filter.Active:
          return !todo.completed;
        case Filter.Completed:
          return todo.completed;
        case Filter.All:
        default:
          return true;
      }
    });
  }, [todos, filter]);

  const activeTodosCount = useMemo(
    () => todos.filter(todo => !todo.completed).length,
    [todos],
  );
  const allCompleted = todos.length > 0 && activeTodosCount === 0;

  useEffect(() => {
    if (input.current) {
      input.current.focus();
    }
  }, []);

  const onAdd = (title: string) => {
    if (!input.current || tempTodo) {
      return;
    }

    const trimmedTitle = title.trim();

    if (trimmedTitle) {
      input.current.disabled = true;

      setTempTodo({
        id: TEMP_TODO_ID,
        title: trimmedTitle,
        completed: false,
      });

      addTodo(trimmedTitle)
        .then(newTodo => {
          setTodos(prevTodos => [...prevTodos, newTodo]);

          if (input.current) {
            input.current.value = '';
          }
        })
        .catch(() => setErrorMessage(ErrorMessage.errorAddFailed))
        .finally(() => {
          if (input.current) {
            input.current.disabled = false;
            input.current.focus();
          }

          setTempTodo(null);
        });
    } else {
      setErrorMessage(ErrorMessage.errorEmptyTitle);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (input.current) {
      onAdd(input.current.value);
    }
  };

  const onUpdate = (id: number, changes: TodoChangeOptions): Promise<void> => {
    const todo = todos.find(td => td.id === id);

    if (!todo) {
      return Promise.resolve();
    }

    setProcessingIds(prev => [...prev, id]);

    return updateTodo(id, {
      completed: changes.completed ?? todo.completed,
      title: changes.title ?? todo.title,
    })
      .then(updatedTodo => {
        setTodos(prevTodos =>
          prevTodos.map(td => (td.id === id ? updatedTodo : td)),
        );
      })
      .catch(() => {
        setErrorMessage(ErrorMessage.errorUpdateFailed);

        return Promise.reject();
      })
      .finally(() => {
        setProcessingIds(prev => prev.filter(todoId => todoId !== id));
      });
  };

  const onToggleAll = () => {
    const shouldCompleteAll = !allCompleted;

    const idsToUpdate = todos
      .filter(todo => todo.completed !== shouldCompleteAll)
      .map(todo => todo.id);

    setProcessingIds(prev => [...prev, ...idsToUpdate]);

    Promise.allSettled(
      idsToUpdate.map(id =>
        updateTodo(id, { completed: shouldCompleteAll })
          .then(updatedTodo => {
            setTodos(prevTodos =>
              prevTodos.map(td => (td.id === id ? updatedTodo : td)),
            );
          })
          .finally(() => {
            setProcessingIds(prev => prev.filter(todoId => todoId !== id));
          }),
      ),
    ).then(results => {
      const hasErrors = results.some(result => result.status === 'rejected');

      if (hasErrors) {
        setErrorMessage(ErrorMessage.errorUpdateFailed);
      }
    });
  };

  const onDelete = (id: number): Promise<void> => {
    setProcessingIds(prev => [...prev, id]);

    return deleteTodo(id)
      .then(() => {
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      })
      .catch(() => {
        setErrorMessage(ErrorMessage.errorDeleteFailed);

        return Promise.reject();
      })
      .finally(() => {
        setProcessingIds(prev => prev.filter(todoId => todoId !== id));
        input.current?.focus();
      });
  };

  const onDeleteCompleted = () => {
    const completedTodos = todos.filter(todo => todo.completed);
    const completedIds = completedTodos.map(todo => todo.id);

    setProcessingIds(prev => [...prev, ...completedIds]);

    Promise.allSettled(
      completedTodos.map(todo =>
        deleteTodo(todo.id)
          .then(() => {
            setTodos(prevTodos => prevTodos.filter(td => td.id !== todo.id));
          })
          .finally(() => {
            setProcessingIds(prev => prev.filter(id => id !== todo.id));
          }),
      ),
    ).then(results => {
      const hasErrors = results.some(result => result.status === 'rejected');

      if (hasErrors) {
        setErrorMessage(ErrorMessage.errorDeleteFailed);
      }

      input.current?.focus();
    });
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">{MainPhrases.headerTitle}</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          {todos.length > 0 && (
            <button
              type="button"
              className={cn('todoapp__toggle-all', {
                active: allCompleted,
              })}
              data-cy="ToggleAllButton"
              onClick={onToggleAll}
            />
          )}

          {/* Add a todo on form submit */}
          <form onSubmit={handleFormSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder={MainPhrases.inputPlaceholder}
              ref={input}
            />
          </form>
        </header>

        {todos.length > 0 && (
          <TodoList
            todos={filteredTodos}
            onUpdate={onUpdate}
            onDelete={onDelete}
            tempTodo={tempTodo}
            processingIds={processingIds}
          />
        )}

        {todos.length > 0 && (
          <TodoFooter
            activeTodosCount={activeTodosCount}
            completedTodosCount={todos.length - activeTodosCount}
            filter={filter}
            onFilterChange={setFilter}
            onDeleteCompleted={onDeleteCompleted}
          />
        )}
      </div>

      <ErrorNotification
        error={errorMessage}
        onClose={() => setErrorMessage(ErrorMessage.default)}
      />
    </div>
  );
};
