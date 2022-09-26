import React from "react";
import "@testing-library/jest-dom";
import { screen, waitFor, within } from "@testing-library/react";
import { UserEvent } from "@testing-library/user-event/dist/types/setup/setup";
import userEvent from "@testing-library/user-event";
import { CLIMB, MULTI_WEEK, TY_TIM } from "@core/__mocks__/events/events.misc";
import { CalendarView } from "@web/views/Calendar";
import { render } from "@web/__tests__/__mocks__/mock.render";
import { preloadedState } from "@web/__tests__/__mocks__/state/state.weekEvents";

describe("Event Form", () => {
  it("opens when clicking events", async () => {
    const user = userEvent.setup();

    render(<CalendarView />, { state: preloadedState });

    expect(screen.queryByRole("form")).not.toBeInTheDocument();

    /* timed event */
    await user.click(screen.getByRole("button", { name: /Ty & Tim/i }));
    await _confirmCorrectEventFormIsOpen(TY_TIM.title);

    /* multi-week event */
    await _clickHeading(user);
    await user.click(screen.getByRole("button", { name: /multiweek event/i }));
    await _confirmCorrectEventFormIsOpen(MULTI_WEEK.title);

    //   /* someday event */
    await _clickHeading(user);
    await user.click(screen.getByRole("button", { name: /takeover world/i }));

    expect(
      within(screen.getByTestId("somedayForm")).getByText("Takeover world")
    ).toBeInTheDocument();
  }, 10000);

  it("closes when clicking outside", async () => {
    /*
        attempt at ESC-ing
        opt: 
          user.keyboard ...
        opt (wasnt working initially):
          fireEvent.keyDown(screen.getByText(/today/i), {
            key: "Escape",
            code: "Escape",
            charCode: 27,
          });
        */

    const user = userEvent.setup();
    render(<CalendarView />, { state: preloadedState });

    await user.click(screen.getByRole("button", { name: CLIMB.title }));

    await _clickHeading(user);

    await waitFor(() => {
      expect(screen.queryByRole("form")).not.toBeInTheDocument();
    });
  }, 10000);

  it("deletes event after clicking trash icon", async () => {
    const user = userEvent.setup();
    render(<CalendarView />, { state: preloadedState });

    await user.click(screen.getByRole("button", { name: CLIMB.title }));

    await user.click(
      screen.getByRole("button", {
        name: /delete event/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: /delete event/i,
        })
      ).not.toBeInTheDocument();
    });
  }, 10000);

  describe("DatePicker", () => {
    it("closes when clicking outside of form, while keeping form open", async () => {
      const user = userEvent.setup();
      render(<CalendarView />, { state: preloadedState });

      await user.click(
        screen.getByRole("button", {
          name: /climb/i,
        })
      );

      await user.click(screen.getAllByRole("tab", { name: /mar 01/i })[0]); // picker should open

      // picker should close
      await user.click(screen.getByRole("form"));

      // looks for the date input that appears when editing
      // (instead of date picker, because sidebar month picker still present)
      const tablist = screen.getByRole("tablist");
      expect(within(tablist).queryByRole("textbox")).not.toBeInTheDocument();

      // form is still open
      await waitFor(() => {
        expect(screen.getByRole("form")).toBeInTheDocument();
      });
    });
  });
});

/***********
 * Helpers *
 ***********/
const _clickHeading = async (user: UserEvent) => {
  await user.click(screen.getByRole("heading", { level: 1 }));
};

const _confirmCorrectEventFormIsOpen = async (eventName: string) => {
  await waitFor(() => {
    expect(
      within(screen.getByRole("form")).getByText(eventName)
    ).toBeInTheDocument();
  });
};
