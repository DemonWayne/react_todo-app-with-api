/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Todo, TodoChangeOptions } from '../types/Todo';

interface Props {
  todo: Todo;
  isLoading?: boolean;
  onDelete: (id: number) => Promise<void>;
  onUpdate?: (id: number, changes: TodoChangeOptions) => Promise<void>;
}

export const TodoItem: React.FC<Props> = ({
  todo,
  isLoading,
  onDelete,
  onUpdate,
}) => {
  const { id, title, completed } = todo;

  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(title);

  useEffect(() => {
    setTitleInput(title);
  }, [title]);

  const onSubmit = () => {
    const trimmedTitle = titleInput.trim();

    if (title === trimmedTitle) {
      setIsEditing(false);

      return;
    }

    if (!trimmedTitle) {
      onDelete(id)
        .then(() => {
          setIsEditing(false);
        })
        .catch(() => {
          setTitleInput(title);
        });

      return;
    }

    onUpdate?.(id, { title: trimmedTitle })
      .then(() => {
        setIsEditing(false);
      })
      .catch(() => {});
  };

  const handleUpdateCancel = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setTitleInput(title);
      setIsEditing(false);
      event.preventDefault();
    }
  };

  return (
    <div
      data-cy="Todo"
      className={classNames('todo', {
        completed: completed,
      })}
    >
      <label className="todo__status-label">
        <input
          data-cy="TodoStatus"
          type="checkbox"
          className="todo__status"
          checked={completed}
          readOnly
          onChange={() => onUpdate?.(id, { completed: !completed })}
        />
      </label>

      {!isEditing ? (
        <>
          <span
            data-cy="TodoTitle"
            className="todo__title"
            onDoubleClick={() => {
              setTitleInput(title);
              setIsEditing(true);
            }}
          >
            {title}
          </span>
          <button
            type="button"
            className="todo__remove"
            data-cy="TodoDelete"
            onClick={() => onDelete(id)}
          >
            ×
          </button>
        </>
      ) : (
        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <input
            data-cy="TodoTitleField"
            autoFocus
            type="text"
            className="todo__title-field"
            placeholder="Empty todo will be deleted"
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
            onBlur={onSubmit}
            onKeyUp={handleUpdateCancel}
          />
        </form>
      )}

      <div
        data-cy="TodoLoader"
        className={classNames('modal overlay', {
          'is-active': isLoading,
        })}
      >
        <div className="modal-background has-background-white-ter" />
        <div className="loader" />
      </div>
    </div>
  );
};
