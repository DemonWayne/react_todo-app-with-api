import React from 'react';
import { FilterType } from '../types/FilterType';
import { TodoFilter } from './TodoFilter';
import { MainPhrases } from '../constants';
import { noun } from '../utils/noun';

interface Props {
  activeTodosCount: number;
  completedTodosCount: number;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onDeleteCompleted: () => void;
}

export const TodoFooter: React.FC<Props> = ({
  activeTodosCount,
  completedTodosCount,
  filter,
  onFilterChange,
  onDeleteCompleted,
}) => {
  const todosNoun = noun(activeTodosCount, [
    MainPhrases.nounItem,
    MainPhrases.nounItems,
  ]);

  const itemsLeft = MainPhrases.footerItemsLeft
    .replace('{count}', String(activeTodosCount))
    .replace('{noun}', todosNoun);

  return (
    <footer className="todoapp__footer" data-cy="Footer">
      <span className="todo-count" data-cy="TodosCounter">
        {itemsLeft}
      </span>

      <TodoFilter filter={filter} onFilterChange={onFilterChange} />

      {/* this button should be disabled if there are no completed todos */}
      <button
        type="button"
        className="todoapp__clear-completed"
        data-cy="ClearCompletedButton"
        disabled={completedTodosCount === 0}
        onClick={() => onDeleteCompleted()}
      >
        {MainPhrases.buttonClearCompleted}
      </button>
    </footer>
  );
};
