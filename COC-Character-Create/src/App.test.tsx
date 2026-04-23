import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('syncs basic identity fields into the preview panel', async () => {
    const user = userEvent.setup();
    render(<App />);

    const nameInput = screen.getByLabelText('调查员姓名');
    await user.clear(nameInput);
    await user.type(nameInput, '林秋生');

    expect(screen.getAllByText('林秋生').length).toBeGreaterThan(0);
  });

  it('saves a snapshot and shows it in the snapshot list', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('调查员姓名'), '沈意');
    await user.click(screen.getAllByRole('button', { name: '保存快照' })[0]);

    expect((await screen.findAllByText('沈意')).length).toBeGreaterThan(1);
  });
});
